const Session = require('../models/Session');
const Student = require('../models/Student');
const Message = require('../models/Message');
const Teacher = require('../models/Teacher');
const { sendAcknowledgement } = require('../services/whatsappService');
const { broadcast } = require('../services/sseService');
const { normalizePhone } = require('../utils/phone');

const splitAnswers = (body = '', count = 3) => {
  const lines = body
    .split(/\r?\n|;/)
    .map((line) => line.replace(/^\s*\d+[.)-]?\s*/, '').trim())
    .filter(Boolean);

  if (lines.length >= count) return lines.slice(0, count);
  return body.trim() ? [body.trim()] : [];
};

const parseMultipleChoice = (value = '') => {
  const direct = String(value).trim().toUpperCase().match(/^[A-Z]$/);
  if (direct) return direct[0];

  const labelled = String(value).toUpperCase().match(/\b[A-Z]\b/);
  return labelled ? labelled[0] : '';
};

const parseSessionAnswers = (body = '', questions = []) => {
  const lines = splitAnswers(body, questions.length);
  const tokens = body.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
  const selectedOptions = [];

  const answers = questions.map((question, index) => {
    const source = lines[index] || tokens[index] || lines[0] || body;

    if (question.type === 'multiple_choice') {
      const selected = parseMultipleChoice(source);
      selectedOptions[index] = selected;
      return selected || String(source || '').trim();
    }

    return String(source || '').trim();
  }).filter(Boolean);

  return {
    answers,
    selectedOptions: selectedOptions.filter(Boolean)
  };
};

const getIncomingText = (messageData = {}) => String(
  messageData?.textMessageData?.textMessage
  || messageData?.extendedTextMessageData?.text
  || messageData?.extendedTextMessageData?.description
  || messageData?.quotedMessage?.textMessage
  || messageData?.quotedMessage?.textMessageData?.textMessage
  || ''
).trim();

const getSenderPhone = (senderData = {}) => normalizePhone(
  senderData.chatId
  || senderData.sender
  || senderData.senderContactName
  || ''
);

const findOrCreateStudent = async (phone) => {
  const student = await Student.findOne({ phone });
  if (student) return student;

  const latestActive = (await Session.find({ status: 'active' }).sort({ date: -1 }).limit(1).lean())[0];
  const teacherId = latestActive?.teacherId?._id || latestActive?.teacherId;

  if (!teacherId) {
    console.warn(`[webhook] Unknown phone ${phone} replied, but no active session exists.`);
    return null;
  }

  const teacher = await Teacher.findById(teacherId).lean();
  if (!teacher) return null;

  const created = await Student.create({
    teacherId,
    name: `Student ${phone.slice(-4)}`,
    phone,
    grade: teacher.grade || 'Class 6',
    language: teacher.language || 'English',
    riskLevel: 'low',
    confidenceLevel: 'medium',
    learningProfile: { strongTopics: [], weakTopics: [], recurringMistakes: [] },
    progressHistory: []
  });

  console.log(`[webhook] Created student ${created.name} for incoming phone ${phone}.`);
  return created;
};

// Green API webhook: POST /api/webhook/whatsapp
const receiveWhatsappResponse = async (req, res) => {
  res.sendStatus(200);

  try {
    const { typeWebhook, senderData, messageData } = req.body || {};

    if (typeWebhook !== 'incomingMessageReceived') return;

    const msgType = messageData?.typeMessage;
    if (!['textMessage', 'quotedMessage', 'extendedTextMessage'].includes(msgType)) return;

    const phone = getSenderPhone(senderData);
    const body = getIncomingText(messageData);

    if (!phone || !body) return;

    const student = await findOrCreateStudent(phone);
    if (!student) return;

    const session = await Session.findOne({
      teacherId: student.teacherId,
      status: 'active'
    }).sort({ date: -1 });

    if (!session || session.formStatus === 'closed') return;

    const parsed = parseSessionAnswers(body, session.questions || []);
    if (!parsed.answers.length) return;

    const payload = {
      studentId: student._id,
      answers: parsed.answers,
      selectedOptions: parsed.selectedOptions,
      score: 0,
      understood: 'partial',
      misconception: '',
      confidenceLevel: 'medium',
      submittedAt: new Date()
    };

    const existing = session.responses.find((r) => String(r.studentId) === String(student._id));
    if (existing) {
      Object.assign(existing, payload);
    } else {
      session.responses.push(payload);
    }

    await session.save();
    await Message.create({
      studentId: student._id,
      sessionId: session._id,
      type: 'reply',
      deliveryMode: 'greenapi',
      status: 'received',
      content: body
    });
    await sendAcknowledgement(student, session);

    const [populated, messages] = await Promise.all([
      Session.findById(session._id)
        .populate('teacherId', 'name subject grade language')
        .populate('responses.studentId', 'name phone riskLevel confidenceLevel'),
      Message.find({ sessionId: session._id }).sort({ createdAt: -1 }).limit(50).populate('studentId', 'name')
    ]);

    broadcast(String(session._id), 'response', {
      sessionId: String(session._id),
      responses: populated.responses,
      responseCount: populated.responses.length,
      messages
    });

    console.log(`[webhook] Stored reply from ${student.name} for ${session.topic}.`);
  } catch (error) {
    console.error('[webhook] Processing failed:', error.message);
  }
};

module.exports = { receiveWhatsappResponse };
