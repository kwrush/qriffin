const chalk = require('chalk');
const { createContentStream, getFileName } = require('./fileUtils');

const DEFAULT_DIR = '/qriffin/shared';
const DIR_PATTERN =
  '^/[a-z0-9]([a-z0-9-]*[a-z0-9])?(/[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$';

const errorHandler = (prefix, error) => {
  let message = error.message || '';
  // dropbox sdk error object
  // { error: `{ error_summary: '...', error: {...} }`, response: ResponseOjbect }
  if (error.error) {
    const errorData = JSON.parse(error.error);
    message = errorData.error_summary;
  }

  throw new Error(`${prefix}${message ? `: ${message}` : ''}`);
};

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

  const contents = createContentStream(file);

  try {
    const { result } = await dbx.filesUpload({
      path: `${directory}/${getFileName(file)}`,
      contents,
      mode: 'add',
      autorename: true,
      mute: true,
      strict_conflict: false,
    });

    return result.path_lower;
  } catch (error) {
    errorHandler('Cannot upload file', error);
  }
};

const checkSharedLinkExists = async (dbx, path) => {
  const {
    result: { links },
  } = await dbx.sharingListSharedLinks({ path });

  if (Array.isArray(links) && links.length > 0) {
    const [{ url }] = links;
    return url;
  }

  return undefined;
};

const createSharedLink = async (dbx, path) => {
  try {
    const res = await checkSharedLinkExists(dbx, path);
    if (res) return res;

    const {
      result: { url },
    } = await dbx.sharingCreateSharedLinkWithSettings({ path });
    return url;
  } catch (error) {
    errorHandler('Cannot create shared link', error);
  }
};

module.exports = {
  upload,
  checkSharedLinkExists,
  createSharedLink,
};
