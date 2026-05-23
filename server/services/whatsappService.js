const Message = require('../models/Message');
const { normalizePhone } = require('../utils/phone');

const persistMessage = async ({ student, sessionId, type, content, deliveryMode, status }) =>
  Message.create({ studentId: student._id, sessionId, type, content, deliveryMode, status });

const greenApiReady = () => Boolean(process.env.GREENAPI_INSTANCE_ID && process.env.GREENAPI_API_TOKEN);

const assertWhatsAppReady = () => {
  if (!greenApiReady()) {
    throw new Error('Green API WhatsApp is not configured. Set GREENAPI_INSTANCE_ID and GREENAPI_API_TOKEN.');
  }
};

const sendWhatsAppText = async (toPhone, content) => {
  const instanceId = process.env.GREENAPI_INSTANCE_ID;
  const apiToken = process.env.GREENAPI_API_TOKEN;
  assertWhatsAppReady();

  const to = normalizePhone(toPhone);
  const url = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${apiToken}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatId: `${to}@c.us`,
      message: content
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Green API error ${response.status}: ${err}`);
  }

  return response.json();
};

const deliverMessage = async ({ student, sessionId, type, content }) => {
  try {
    console.log(`[whatsapp] Sending ${type} message to ${student.name}.`);
    await sendWhatsAppText(student.phone, content);
    return persistMessage({ student, sessionId, type, content, deliveryMode: 'greenapi', status: 'sent' });
  } catch (error) {
    console.error(`[whatsapp] ${type} delivery failed for ${student.name}:`, error.message);
    return persistMessage({ student, sessionId, type, content, deliveryMode: 'greenapi', status: 'failed' });
  }
};

const formatQuestions = (session) => {
  const questionsList = session.questions
    .map((question, index) => {
      let formatted = `Q${index + 1}: ${question.question}\n`;
      if (question.type === 'multiple_choice' && Array.isArray(question.options)) {
        question.options.forEach((option, optIdx) => {
          formatted += `  ${String.fromCharCode(65 + optIdx)}. ${option}\n`;
        });
      }
      return formatted;
    })
    .join('\n');

  return `Hi {studentName}! Your teacher wants to check your understanding of today's topic: ${session.topic}

Please reply with your answers:
${questionsList}
For multiple choice questions, reply with the letter (A, B, C, etc.).
Just reply to this message with your answers.`;
};

const sendQuestionsToStudent = (student, session) =>
  deliverMessage({
    student,
    sessionId: session._id,
    type: 'question',
    content: formatQuestions(session).replace('{studentName}', student.name)
  });

const sendFeedbackToStudent = (student, session, content) =>
  deliverMessage({ student, sessionId: session._id, type: 'feedback', content });

const sendAcknowledgement = (student, session) =>
  deliverMessage({
    student,
    sessionId: session._id,
    type: 'acknowledgement',
    content: 'Thank you for your responses. Your teacher will review them and share personalised feedback soon.'
  });

const sendParentSummary = (student, session, content) =>
  deliverMessage({ student, sessionId: session._id, type: 'feedback', content: `Parent update: ${content}` });

module.exports = {
  assertWhatsAppReady,
  greenApiReady,
  sendWhatsAppText,
  sendQuestionsToStudent,
  sendFeedbackToStudent,
  sendAcknowledgement,
  sendParentSummary
};
