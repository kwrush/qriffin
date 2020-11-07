const stripAnsi = require('strip-ansi');
const QRCode = require('qrcode');

const createAuthServer = require('../src/createAuthServer');
const runCli = require('../src/cli');
const setupDbx = require('../src/setupDbx');
const { upload, createSharedLink } = require('../src/utils/dbxUtils');
const createQRCode = require('../src/utils/createQRCode');

jest.mock('ora', () => () => ({
  start: () => ({
    succeed: jest.fn(),
    fail: jest.fn(),
  }),
}));

jest.mock('qrcode', () => ({
  toString: jest.fn().mockResolvedValue('qrcode'),
}));

jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(process, 'exit').mockImplementation(() => {});

jest.mock('../src/createAuthServer', () => jest.fn());

jest.mock('../src/utils/fileUtils', () => ({
  getFileName: jest.fn().mockReturnValue('filename'),
  createContentStream: jest.fn().mockReturnValue('contents'),
}));
jest.mock('../src/utils/dbxUtils', () => ({
  upload: jest.fn(),
  createSharedLink: jest.fn(),
}));
jest.mock('../src/setupDbx', () => jest.fn());
jest.mock('../src/utils/createQRCode', () => jest.fn());

const configStoreMock = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
};

describe('qriffin', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setupDbx', () => {
    let setupDbx;

    beforeAll(() => {
      setupDbx = jest.requireActual('../src/setupDbx');
    });

    it('should set refresh token', async () => {
      configStoreMock.get.mockImplementation(() => 'token');
      const dbx = await setupDbx({}, configStoreMock);

      expect(dbx.auth.getRefreshToken()).toBe('token');
    });

    it('should set the refresh token acquired from auth server', async () => {
      configStoreMock.get.mockImplementation(() => undefined);
      createAuthServer.mockImplementation(() => 'new token');
      const dbx = await setupDbx({}, configStoreMock);

      expect(configStoreMock.set).toHaveBeenCalledWith(
        'refresh-token',
        'new token',
      );
      expect(dbx.auth.getRefreshToken()).toBe('new token');
    });
  });

  describe('dbxUtils', () => {
    let upload, createSharedLink;
    beforeAll(() => {
      const dbxUtils = jest.requireActual('../src/utils/dbxUtils');
      upload = dbxUtils.upload;
      createSharedLink = dbxUtils.createSharedLink;
    });

    it('should throw error when directory format is incorrect', async () => {
      await expect(upload(null, '', 'wrong/dir/')).rejects.toThrow();
    });

    it('should pass the correct parameters and return uploaded file path', async () => {
      const res = {
        status: 200,
        result: { path_lower: 'file/in/dropbox' },
      };

      const dbxMock = {
        filesUpload: jest.fn().mockResolvedValue(res),
      };

      const p = await upload(dbxMock, 'file/to/upload');
      expect(dbxMock.filesUpload).toHaveBeenCalledWith({
        path: '/qriffin/shared/filename',
        contents: 'contents',
        mode: 'add',
        autorename: true,
        mute: true,
        strict_conflict: false,
      });
      expect(p).toBe('file/in/dropbox');
    });

    it('should throw `cannot upload` error', async () => {
      const dbxMock = {
        filesUpload: jest.fn().mockResolvedValue({ status: 400 }),
      };
      await expect(
        upload(dbxMock, 'file/to/upload'),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"Cannot upload file"`);
    });

    it('should create shared link', async () => {
      const res = {
        status: 200,
        result: { url: 'sharedlink' },
      };
      const dbxMock = {
        sharingCreateSharedLinkWithSettings: jest.fn().mockResolvedValue(res),
      };

      const link = await createSharedLink(dbxMock, 'file/to/share');
      expect(link).toBe('sharedlink');
    });

    it('should throw `cannot create shared link` error', async () => {
      const dbxMock = {
        sharingCreateSharedLinkWithSettings: jest
          .fn()
          .mockResolvedValue({ status: 400 }),
      };

      await expect(
        createSharedLink(dbxMock, 'file/to/share'),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"Cannot create shared link"`,
      );
    });
  });

  describe('createQRCode', () => {
    let createQRCode;
    beforeAll(() => {
      createQRCode = jest.requireActual('../src/utils/createQRCode');
    });

    it('should return qrcode', async () => {
      const res = await createQRCode('link');
      expect(res).toBe('qrcode');
    });

    it('should throw error', async () => {
      QRCode.toString = jest.fn().mockRejectedValue(new Error('error'));
      await expect(createQRCode).rejects.toThrowErrorMatchingInlineSnapshot(
        `"Something went wrong on creating QR code: error"`,
      );
    });
  });

  describe('cli', () => {
    it('should clear token and quit program', async () => {
      await runCli('/file/to/share', { clearToken: true }, configStoreMock);

      expect(configStoreMock.delete).toHaveBeenCalledWith('refresh-token');
      expect(stripAnsi(console.log.mock.calls[0][0])).toMatchInlineSnapshot(
        `"Refresh token has been deleted, authorization is required next time."`,
      );
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('should upload and create shared link and quit', async () => {
      setupDbx.mockResolvedValue({});
      upload.mockResolvedValue('upload/path');
      createSharedLink.mockResolvedValue('sharedlink');
      createQRCode.mockResolvedValue('qrcode');

      await runCli('/file/to/share', {}, configStoreMock);
      expect(stripAnsi(console.log.mock.calls[0][0])).toMatchInlineSnapshot(
        `"qrcode"`,
      );
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('should print error and quit', async () => {
      setupDbx.mockResolvedValue({});
      upload.mockRejectedValue({ message: 'Foo' });

      await runCli('/file/to/share', {}, configStoreMock);

      expect(stripAnsi(console.error.mock.calls[0][0])).toMatchInlineSnapshot(
        `"Foo"`,
      );
      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });
});
