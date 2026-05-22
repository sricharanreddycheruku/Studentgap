const twilio = require('twilio');
const Message = require('../models/Message');

const isMockMode = () => String(process.env.USE_MOCK_WHATSAPP).toLowerCase() === 'true';
const whatsappAddress = (number = '') => number.startsWith('whatsapp:') ? number : `whatsapp:${number}`;

const persistMessage = async ({ student, sessionId, type, content, deliveryMode, status }) => Message.create({
  studentId: student._id,
  sessionId,
  type,
  content,
  deliveryMode,
  status
});

const deliverMessage = async ({ student, sessionId, type, content }) => {
  if (isMockMode()) {
    console.log(`[twilio] Mock ${type} message for ${student.name}: ${content.slice(0, 90)}`);
    return persistMessage({ student, sessionId, type, content, deliveryMode: 'mock', status: 'sent' });
  }

  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_NUMBER) {
      throw new Error('Twilio WhatsApp credentials are not fully configured.');
    }

    console.log(`[twilio] Sending ${type} message to ${student.name}.`);
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: content,
      from: whatsappAddress(process.env.TWILIO_WHATSAPP_NUMBER),
      to: whatsappAddress(student.phone)
    });
    return persistMessage({ student, sessionId, type, content, deliveryMode: 'twilio', status: 'sent' });
  } catch (error) {
    console.error(`[twilio] ${type} delivery failed for ${student.name}; saved as pending:`, error.message);
    return persistMessage({ student, sessionId, type, content, deliveryMode: 'twilio', status: 'pending' });
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

const sendQuestionsToStudent = async (student, session) => deliverMessage({
  student,
  sessionId: session._id,
  type: 'question',
  content: formatQuestions(session).replace('{studentName}', student.name)
});

const sendFeedbackToStudent = async (student, session, content) => deliverMessage({
  student,
  sessionId: session._id,
  type: 'feedback',
  content
});

const sendAcknowledgement = async (student, session) => deliverMessage({
  student,
  sessionId: session._id,
  type: 'acknowledgement',
  content: 'Thank you for your responses! Your teacher will review them and share feedback soon. Keep it up! \u{1F44D}'
});

const sendParentSummary = async (student, session, content) => deliverMessage({
  student,
  sessionId: session._id,
  type: 'feedback',
  content: `Parent update: ${content}`
});

module.exports = {
  sendQuestionsToStudent,
  sendFeedbackToStudent,
  sendAcknowledgement,
  sendParentSummary
};
