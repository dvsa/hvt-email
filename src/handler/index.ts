import type { Context, DynamoDBStreamEvent } from 'aws-lambda';
import { createLogger, Logger } from '../util/logger';

/**
 * Lambda Handler
 *
 * @param {ScheduledEvent} event
 * @param {Context} context
 * @returns {Promise<void>}
 */
export const handler = async (event: DynamoDBStreamEvent, context: Context): Promise<void> => {
  const logger: Logger = createLogger(null, context);
  logger.info('Confirmation email lambda triggered.');

  const records = event.Records;
  console.log(records);
};
