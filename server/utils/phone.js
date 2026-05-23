const normalizePhone = (value = '') => String(value)
  .replace('whatsapp:', '')
  .replace('@c.us', '')
  .replace(/[^\d+]/g, '')
  .replace(/^\+/, '');

const validatePhone = (value = '') => {
  const phone = normalizePhone(value);

  if (!/^\d{7,15}$/.test(phone)) {
    return {
      valid: false,
      error: 'Phone number must be 7-15 digits with country code, for example 919876543210.'
    };
  }

  return { valid: true, phone };
};

const toE164 = (value = '') => {
  const phone = normalizePhone(value);
  return phone ? `+${phone}` : '';
};

module.exports = {
  normalizePhone,
  validatePhone,
  toE164
};
