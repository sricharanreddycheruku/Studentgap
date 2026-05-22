const Message = require('../models/Message');

const isMockMode = () => String(process.env.USE_MOCK_WHATSAPP).toLowerCase() === 'true';

const normalizePhone = (number = '') =>
  String(number).replace('whatsapp:', '').replace(/\s+/g, '').replace(/^\+/, '');

const persistMessage = async ({ student, sessionId, type, content, deliveryMode, status }) =>
  Message.create({ studentId: student._id, sessionId, type, content, deliveryMode, status });

const sendMetaMessage = async (toPhone, content) => {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error('WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID must be set.');
  }

  const to = normalizePhone(toPhone);
  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: `+${to}`,
      type: 'text',
      text: { body: content },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Meta API error ${response.status}: ${err}`);
  }

  return response.json();
};

const deliverMessage = async ({ student, sessionId, type, content }) => {
  if (isMockMode()) {
    console.log(`[whatsapp] Mock ${type} message for ${student.name}: ${content.slice(0, 90)}`);
    return persistMessage({ student, sessionId, type, content, deliveryMode: 'mock', status: 'sent' });
  }

  try {
    console.log(`[whatsapp] Sending ${type} message to ${student.name}.`);
    await sendMetaMessage(student.phone, content);
    return persistMessage({ student, sessionId, type, content, deliveryMode: 'meta', status: 'sent' });
  } catch (error) {
    console.error(`[whatsapp] ${type} delivery failed for ${student.name}:`, error.message);
    return persistMessage({ student, sessionId, type, content, deliveryMode: 'meta', status: 'pending' });
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
For multiple choice questions, reply with the letter (A, B, C, etc.)
Just reply to this message with your answers!`;
};

const sendQuestionsToStudent = (student, session) =>
  deliverMessage({
    student,
    sessionId: session._id,
    type: 'question',
    content: formatQuestions(session).replace('{studentName}', student.name),
  });

const sendFeedbackToStudent = (student, session, content) =>
  deliverMessage({ student, sessionId: session._id, type: 'feedback', content });

const sendAcknowledgement = (student, session) =>
  deliverMessage({
    student,
    sessionId: session._id,
    type: 'acknowledgement',
    content: 'Thank you for your responses! Your teacher will review them and share feedback soon. Keep it up! 👍',
  });

const sendParentSummary = (student, session, content) =>
  deliverMessage({ student, sessionId: session._id, type: 'feedback', content: `Parent update: ${content}` });

module.exports = {
  sendQuestionsToStudent,
  sendFeedbackToStudent,
  sendAcknowledgement,
  sendParentSummary,
};
