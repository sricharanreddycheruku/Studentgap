const Session = require('../models/Session');
const Student = require('../models/Student');
const Message = require('../models/Message');
const { twiml } = require('twilio');

const ACKNOWLEDGEMENT = 'Response received! Your teacher will review and share personalised feedback soon. Keep it up! 👍';

const normalizePhone = (value = '') => String(value)
  .replace('whatsapp:', '')
  .replace(/\s+/g, '')
  .replace(/^\+/, '');

const sendTwiml = (res, status, message) => {
  const response = new twiml.MessagingResponse();
  response.message(message);
  return res.status(status).type('text/xml').send(response.toString());
};

const parseAnswers = (body = '', count = 3) => {
  const answerLines = body
    .split(/\r?\n|;/)
    .map((line) => line.replace(/^\s*\d+[.)-]?\s*/, '').trim())
    .filter(Boolean);

  if (answerLines.length >= count) {
    return answerLines.slice(0, count);
  }

  return body.trim() ? [body.trim()] : [];
};

const parseMultipleChoice = (body = '', questionCount = 0) => {
  const responses = body
    .replace(/,/g, ' ')
    .split(/\s+/)
    .map((item) => item.toUpperCase().trim())
    .filter((item) => /^[A-Z]$/.test(item));
  return responses.slice(0, questionCount);
};

const receiveWhatsappResponse = async (req, res) => {
  try {
    const from = normalizePhone(req.body.From || req.body.from);
    const body = String(req.body.Body || req.body.body || '').trim();

    console.log(`[webhook] Incoming WhatsApp from normalized: ${from}`);

    if (!from || !body) {
      return sendTwiml(res, 400, 'Please send your answers as a text message.');
    }

    const student = await Student.findOne({ phone: from });

    if (!student) {
      console.warn(`[webhook] No student found for phone: ${from}`);
      return sendTwiml(res, 404, 'Your WhatsApp number is not registered in any class roster. Please contact your teacher.');
    }

    const session = await Session.findOne({
      teacherId: student.teacherId,
      status: 'active'
    }).sort({ date: -1 });

    if (!session) {
      return sendTwiml(res, 404, 'No active classroom check-in right now. Your teacher will send one soon!');
    }

    if (session.formStatus === 'closed') {
      return sendTwiml(res, 400, 'The form for this session is now closed. Thank you for participating!');
    }

    const hasMCQ = session.questions.some((q) => q.type === 'multiple_choice');
    let answers = [];
    let selectedOptions = [];

    if (hasMCQ) {
      selectedOptions = parseMultipleChoice(body, session.questions.length);
      answers = selectedOptions;
    } else {
      answers = parseAnswers(body, session.questions.length);
    }

    if (!answers.length) {
      return sendTwiml(res, 400, 'Please provide at least one answer. Reply with your answers to the questions.');
    }

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
      deliveryMode: 'twilio',
      status: 'sent',
      content: ACKNOWLEDGEMENT
    });

    console.log(`[webhook] Stored WhatsApp response from ${student.name} for ${session.topic}.`);
    return sendTwiml(res, 200, ACKNOWLEDGEMENT);
  } catch (error) {
    console.error('[webhook] WhatsApp response failed:', error.message);
    return sendTwiml(res, 500, 'Something went wrong. Please try again.');
  }
};

module.exports = { receiveWhatsappResponse };
