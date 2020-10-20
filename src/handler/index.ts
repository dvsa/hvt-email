import 'dotenv/config';
import type { Context, DynamoDBStreamEvent } from 'aws-lambda';

import { availabilityHasChanged, extractAvailabilityData } from '../lib/availability';
import { getEmailTemplates } from '../lib/get-email-template';
import { getConfig } from '../lib/config';
import handle from '../util/handle-await-error';
import { createLogger, Logger } from '../util/logger';
import { AvailabilityChangeData } from '../types';
import { buildSQSMessage, enqueueEmailMessages, EmailMessageRequest } from '../lib/email';

export const handler = async (event: DynamoDBStreamEvent, context: Context): Promise<void> => {
  const logger: Logger = createLogger(null, context);
  logger.info('Confirmation email lambda triggered.');

  const config = getConfig();

  // Fetch templates from S3
  logger.info('Fetching email templates from S3...');
  const [err, templates] = await handle(getEmailTemplates({
    awsRegion: config.awsRegion,
    bucket: config.emailTemplateS3Bucket,
    availableTemplate: config.availableEmailTemplateS3Object,
    fullyBookedTemplate: config.fullyBookedEmailTemplateS3Object,
  }));
  if (err) {
    logger.error(`An error occurred while fetching the email templates from S3: ${err.message}`);
    throw err;
  }
  const { availableTemplate, fullyBookedTemplate } = templates;

  // Loop through each record
  const records = event.Records;
  const emailMessages: EmailMessageRequest[] = [];
  logger.info(`Received ${records.length} records from DynamoDB.`);
  records.forEach((record) => {
    // Discard INSERT and REMOVE events
    if (record.eventName !== 'MODIFY') {
      logger.info(`Discarding ${record.eventName} event.`);
      return;
    }

    // Extract data from event
    let availabilityData: AvailabilityChangeData;
    try {
      availabilityData = extractAvailabilityData(record);
    } catch (err2) {
      logger.error((err2 as Error).message);
      return; // skip to next record
    }
    const {
      oldAvailability,
      newAvailability,
    } = availabilityData;

    // Any changes we're actually concerned about?
    if (availabilityHasChanged(oldAvailability, newAvailability)) {
      const emailMessageRequest = buildSQSMessage({
        queueUrl: config.queueUrl,
        atfId: availabilityData.id,
        atfEmail: availabilityData.email,
        templateValues: {
          atfName: availabilityData.name,
          tokens: availabilityData.tokens,
          availableTemplate,
          fullyBookedTemplate,
          availability: newAvailability,
        },
      });
      emailMessages.push(emailMessageRequest);
    }
  });

  await enqueueEmailMessages({
    emailMessages,
    awsRegion: config.awsRegion,
    logger,
  });

  logger.info('Confirmation email lambda done.');
};
