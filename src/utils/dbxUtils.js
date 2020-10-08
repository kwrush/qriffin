const chalk = require('chalk');
const { createContentStream, getFileName } = require('./fileUtils');

const DEFAULT_DIR = '/fox-cli/shared';
const DIR_PATTERN =
  '^/[a-z0-9]([a-z0-9-]*[a-z0-9])?(/[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$';

// TOOD: Improve error message
const upload = async (dbx, file, directory = DEFAULT_DIR) => {
  if (
    typeof directory !== 'string' ||
    !directory.match(new RegExp(DIR_PATTERN))
  ) {
    throw new Error(
      `Invalid directory value, please specify the '--directory' option in the format: ${chalk.white.underline(
        '/directory/in/your/dropbox',
      )}`,
    );
  }

  const contents = await createContentStream(file);

  const filemeta = await dbx.filesUpload({
    path: `${directory}/${getFileName(file)}`,
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
