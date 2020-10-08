const fs = require('fs');
const path = require('path');

const isFile = (f) => fs.existsSync(f) && fs.statSync(f).isFile();

const isFileSizeOk = (f) => {
  const stats = fs.statSync(f);
  return Math.floor(stats.size / 1000000) <= 150;
};

const getFileName = (f) => {
  const fullpath = path.resolve(f);
  return path.basename(fullpath);
};

const createContentStream = (f) => {
  const fullpath = path.resolve(f);

  if (!isFile(fullpath)) {
    throw new Error('No specified file found');
  }

  if (!isFileSizeOk(fullpath)) {
    throw new Error('File larger than 150MB is not supported');
  }

  return fs.createReadStream(fullpath);
};

module.exports = {
  isFile,
  getFileName,
  createContentStream,
};
