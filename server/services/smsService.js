const twilio = require('twilio');
const { toE164 } = require('../utils/phone');

const smsReady = () => Boolean(
  process.env.TWILIO_ACCOUNT_SID
  && process.env.TWILIO_AUTH_TOKEN
  && process.env.TWILIO_SMS_FROM
);

const sendSms = async (phone, body) => {
  if (!smsReady()) {
    throw new Error('Twilio SMS is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_SMS_FROM.');
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    to: toE164(phone),
    from: process.env.TWILIO_SMS_FROM,
    body
  });
};

module.exports = {
  smsReady,
  sendSms
};
