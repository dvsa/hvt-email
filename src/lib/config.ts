interface Config {
  awsRegion: string,
  emailTemplateS3Bucket: string,
  availableEmailTemplateS3Object: string,
  fullyBookedEmailTemplateS3Object: string,
  queueUrl: string,
}

export const getConfig = (): Config => {
  [
    'AWS_DEFAULT_REGION',
    'EMAIL_TEMPLATE_S3_BUCKET',
    'AVAILABLE_EMAIL_TEMPLATE_S3_OBJECT',
    'FULLY_BOOKED_EMAIL_TEMPLATE_S3_OBJECT',
    'SQS_QUEUE_URL',
  ].forEach((envVar) => {
    if (!process.env[`${envVar}`]) {
      throw new Error(`Environment variable ${envVar} seems to be missing.`);
    }
  });
  return {
    awsRegion: process.env.AWS_DEFAULT_REGION,
    emailTemplateS3Bucket: process.env.EMAIL_TEMPLATE_S3_BUCKET,
    availableEmailTemplateS3Object: process.env.AVAILABLE_EMAIL_TEMPLATE_S3_OBJECT,
    fullyBookedEmailTemplateS3Object: process.env.FULLY_BOOKED_EMAIL_TEMPLATE_S3_OBJECT,
    queueUrl: process.env.SQS_QUEUE_URL,
  };
};
