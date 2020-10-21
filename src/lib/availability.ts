import AWS from 'aws-sdk';
import type { DynamoDBRecord } from 'aws-lambda';
import deepEqual from 'deep-equal';
import Joi from 'joi';

import { Availability, AvailabilityChangeData, TokenPair } from '../types';

const atfSchema = Joi.object({
  id: Joi.string().uuid().required(),
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  tokens: Joi.object({
    yes: Joi.string().required(),
    no: Joi.string().required(),
  }),
}).unknown(true);

const availabilitySchema = Joi.object({
  lastUpdated: Joi.date().iso().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
  isAvailable: Joi.boolean().required(),
});

export const extractAvailabilityData = (record: DynamoDBRecord): AvailabilityChangeData => {
  const oldImage = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.OldImage);
  const newImage = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);

  const newImageValResult = atfSchema.validate(newImage);
  if (newImageValResult.error || newImageValResult.errors) {
    throw new Error(`Marlformed rercord: ${JSON.stringify(newImage)}`);
  }

  const {
    id, name, email, tokens, availability: newAvailability,
  } = newImage;
  const { availability: oldAvailability } = oldImage;
  const newAvailabilityValResult = availabilitySchema.validate(newAvailability);
  if (newAvailabilityValResult.error || newAvailabilityValResult.errors) {
    throw new Error(`Malformed "availability" field in: ${JSON.stringify(newImage)}`);
  }

  return {
    id: id as string,
    name: name as string,
    email: email as string,
    tokens: tokens as TokenPair,
    oldAvailability: oldAvailability as Availability,
    newAvailability: newImage.availability as Availability,
  };
};

export const availabilityHasChanged = (
  oldAvailability: Availability | void,
  newAvailability: Availability | void,
): boolean => {
  if (oldAvailability && !newAvailability) {
    return false; // Availability data deleted for some reason. Stop here.
  }
  return !deepEqual(oldAvailability, newAvailability, { strict: true });
};
