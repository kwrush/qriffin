const { createContentStream, getFileName } = require('./fileUtils');

// TOOD: Improve error message
const upload = async (dbx, file) => {
  const contents = await createContentStream(file);

  const filemeta = await dbx.filesUpload({
    path: `/fox-cli/shared/${getFileName(file)}`,
    contents,
    mode: 'add',
    autorename: true,
    mute: true,
    strict_conflict: false,
  });

  if (filemeta.status >= 400) {
    throw new Error('Cannot upload file');
  }

  return filemeta.result.path_lower;
};

const createSharedLink = async (dbx, path) => {
  const linkmeta = await dbx.sharingCreateSharedLinkWithSettings({ path });
  if (linkmeta.status >= 400) {
    throw new Error('Cannot create shared link');
  }

  return linkmeta.result.url;
};

module.exports = {
  upload,
  createSharedLink,
};
