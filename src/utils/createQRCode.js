const QRCode = require('qrcode');

module.exports = (link) => {
  return new Promise((resolve, reject) => {
    QRCode.toString(link, { type: 'utf8' }, (error, url) => {
      if (error) {
        return reject(
          new Error(
            `Something went wrong on creating QR code: ${error.message}`,
          ),
        );
      }

      resolve(url);
    });
  });
};
