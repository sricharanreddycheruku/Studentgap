const Session = require('../models/Session');
const Student = require('../models/Student');
const Message = require('../models/Message');
const { broadcast } = require('../services/sseService');

const ACKNOWLEDGEMENT = 'Response received! Your teacher will review and share personalised feedback soon. Keep it up! 👍';

const normalizePhone = (value = '') => String(value)
  .replace('@c.us', '')
  .replace('whatsapp:', '')
  .replace(/\s+/g, '')
  .replace(/^\+/, '');

const parseAnswers = (body = '', count = 3) => {
  const answerLines = body
    .split(/\r?\n|;/)
    .map((line) => line.replace(/^\s*\d+[.)-]?\s*/, '').trim())
    .filter(Boolean);

  if (answerLines.length >= count) return answerLines.slice(0, count);
  return body.trim() ? [body.trim()] : [];
};

const parseMultipleChoice = (body = '', questionCount = 0) => {
  return body
    .replace(/,/g, ' ')
    .split(/\s+/)
    .map((item) => item.toUpperCase().trim())
    .filter((item) => /^[A-Z]$/.test(item))
    .slice(0, questionCount);
};

// Green API webhook — POST /api/webhook/whatsapp
const receiveWhatsappResponse = async (req, res) => {
  res.sendStatus(200);

  try {
    const { typeWebhook, senderData, messageData } = req.body || {};

    if (typeWebhook !== 'incomingMessageReceived') return;

    const msgType = messageData?.typeMessage;
    if (!['textMessage', 'quotedMessage', 'extendedTextMessage'].includes(msgType)) return;

    const from = normalizePhone(senderData?.chatId || senderData?.sender || '');
    // Handle plain text, quoted replies, and extended text messages
    const body = String(
      messageData?.textMessageData?.textMessage ||
      messageData?.extendedTextMessageData?.text ||
      messageData?.quotedMessage?.textMessage ||
      ''
    ).trim();

    console.log(`[webhook] Incoming WhatsApp from: ${from}`);
    if (!from || !body) return;

    const student = await Student.findOne({ phone: from });
    if (!student) {
      console.warn(`[webhook] No student found for phone: ${from}`);
      return;
    }

    const session = await Session.findOne({
      teacherId: student.teacherId,
      status: 'active'
    }).sort({ date: -1 });

    if (!session || session.formStatus === 'closed') return;

    const hasMCQ = session.questions.some((q) => q.type === 'multiple_choice');
    let answers = [];
    let selectedOptions = [];

    if (hasMCQ) {
      selectedOptions = parseMultipleChoice(body, session.questions.length);
      answers = selectedOptions;
    } else {
      answers = parseAnswers(body, session.questions.length);
    }

    if (!answers.length) return;

    const existing = session.responses.find((r) => String(r.studentId) === String(student._id));
    const payload = {
      studentId: student._id,
      answers,
      selectedOptions,
      score: 0,
      understood: 'partial',
      misconception: '',
      confidenceLevel: 'medium',
      submittedAt: new Date()
    };

    if (existing) {
      Object.assign(existing, payload);
    } else {
      session.responses.push(payload);
    }

    await session.save();
    await Message.create({
      studentId: student._id,
      sessionId: session._id,
      type: 'acknowledgement',
      deliveryMode: 'greenapi',
      status: 'sent',
      content: ACKNOWLEDGEMENT
    });

    const populated = await Session.findById(session._id)
      .populate('teacherId', 'name subject grade language')
      .populate('responses.studentId', 'name phone riskLevel confidenceLevel');

    broadcast(String(session._id), 'response', {
      sessionId: String(session._id),
      responses: populated.responses,
      responseCount: populated.responses.length
    });

    console.log(`[webhook] Stored response from ${student.name} for ${session.topic}.`);
  } catch (error) {
    console.error('[webhook] Processing failed:', error.message);
  }
};

module.exports = { receiveWhatsappResponse };
