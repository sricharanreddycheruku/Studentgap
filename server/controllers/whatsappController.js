const Session = require('../models/Session');
const Student = require('../models/Student');
const Message = require('../models/Message');

const ACKNOWLEDGEMENT = 'Response received! Your teacher will review and share personalised feedback soon. Keep it up! 👍';

const normalizePhone = (value = '') => String(value)
  .replace('whatsapp:', '')
  .replace(/\s+/g, '')
  .replace(/^\+/, '');

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

// GET /api/webhook/whatsapp — Meta webhook verification
const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[webhook] Meta webhook verified.');
    return res.status(200).send(challenge);
  }

  console.warn('[webhook] Meta webhook verification failed.');
  return res.sendStatus(403);
};

// POST /api/webhook/whatsapp — incoming messages from Meta
const receiveWhatsappResponse = async (req, res) => {
  // Always respond 200 immediately so Meta doesn't retry
  res.sendStatus(200);

  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message || message.type !== 'text') return;

    const from = normalizePhone(message.from);
    const body = String(message.text?.body || '').trim();

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
      deliveryMode: 'meta',
      status: 'sent',
      content: ACKNOWLEDGEMENT
    });

    console.log(`[webhook] Stored WhatsApp response from ${student.name} for ${session.topic}.`);
  } catch (error) {
    console.error('[webhook] WhatsApp response processing failed:', error.message);
  }
};

module.exports = { verifyWebhook, receiveWhatsappResponse };
