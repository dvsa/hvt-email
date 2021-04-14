import 'dotenv/config';

import type { Context, SQSEvent } from 'aws-lambda';
import { getConfig } from '../lib/config';
import { validateAvailabilityData } from '../lib/availability';
import { getEmailTemplates } from '../lib/get-email-template';
import { buildSQSMessage, enqueueEmailMessages, EmailMessageRequest } from '../lib/email';
import handle from '../util/handle-await-error';
import { createLogger, Logger } from '../util/logger';
import { AvailabilityChangeData } from '../types';

export const handler = async (event: SQSEvent, context: Context): Promise<void> => {
  const logger: Logger = createLogger(null, context);
  const config = getConfig();
  logger.info('Confirmation email lambda triggered.');

  logger.info('Fetching email templates from S3...');
  const [err, templates] = await handle(getEmailTemplates({
    awsRegion: config.awsRegion,
    bucket: config.emailTemplateS3Bucket,
    availableTemplate: config.availableEmailTemplateS3Object,
    fullyBookedTemplate: config.fullyBookedEmailTemplateS3Object,
    endpoint: config.emailTemplateS3Endpoint,
  }));

  if (err) {
    logger.error(`An error occurred while fetching the email templates from S3: ${err.message}`);
    throw err;
  }

  const { availableTemplate, fullyBookedTemplate } = templates;

  const records = event.Records;
  const emailMessages: EmailMessageRequest[] = [];
  logger.info(`Received ${records.length} records from DynamoDB.`);
  records.forEach((record) => {
    logger.debug(`Processing record: ${JSON.stringify(record)}`);

    let message: AvailabilityChangeData;
    let availabilityData: AvailabilityChangeData;
    try {
      const body: Record<string, string> = <Record<string, string>> JSON.parse(record.body);
      message = JSON.parse(body.Message) as AvailabilityChangeData;
      availabilityData = validateAvailabilityData(message);
    } catch (error) {
      if (error instanceof SyntaxError) {
        logger.error(`Error while parsing message body for messageId: ${record.messageId}`);
        logger.error(error.message);
        return;
      }
      logger.error((error as Error).message);
      return;
    }

    const emailMessageRequest = buildSQSMessage({
      queueUrl: config.queueUrl,
      atfId: availabilityData.id,
      atfEmail: availabilityData.email,
      templateId: config.templateId,
      templateValues: {
        atfName: availabilityData.name,
        token: availabilityData.token,
        availableTemplate,
        fullyBookedTemplate,
        availability: availabilityData.availability,
        emailLinkBaseUrl: config.emailLinkBaseUrl,
      },
    });

    emailMessages.push(emailMessageRequest);
  });

  if (emailMessages.length) {
    const [emailError] = await handle(enqueueEmailMessages({
      emailMessages,
      awsRegion: config.awsRegion,
      logger,
    }));
    if (emailError) {
      logger.error(`Error while enqueueing email message(s): ${emailError.message}`);
      throw emailError;
    }
  }

  logger.info('Confirmation email lambda done.');
};
