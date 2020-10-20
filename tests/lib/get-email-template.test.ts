import AWS from 'aws-sdk';
import { getEmailTemplate } from '../../src/lib/get-email-template';

const expectedTemplate = 'some template';

const getObjectMock = jest.fn(() => ({
  promise: jest.fn(() => ({
    Body: Buffer.from(expectedTemplate),
  })),
}));

jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    getObject: getObjectMock,
  })),
}));

describe('getEmailTemplate()', () => {
  it('fetches the email template from the correct S3 bucket and object', async () => {
    const bucket = 'dummyBucket';
    const templateName = 'dummyKey';
    const template = await getEmailTemplate({ bucket, template: templateName, awsRegion: 'eu-west-2' });

    expect(AWS.S3).toHaveBeenCalledTimes(1);
    expect(getObjectMock).toHaveBeenCalledTimes(1);
    expect(getObjectMock).toHaveBeenCalledWith({
      Bucket: bucket,
      Key: templateName,
    });
    expect(template).toEqual(expectedTemplate);
  });
});
