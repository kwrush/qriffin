const QRCode = require('qrcode');

module.exports = async (link) => {
  try {
    return await QRCode.toString(link, { type: 'terminal', small: true });
  } catch (error) {
    throw new Error(
      `Something went wrong on creating QR code: ${error.message}`,
    );
  }
};
