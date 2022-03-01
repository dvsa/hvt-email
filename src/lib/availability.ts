import Joi from 'joi';
import { AvailabilityChangeData } from '../types';

const atfSchema = Joi.object({
  id: Joi.string().uuid().required(),
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  token: Joi.string().required(),
}).unknown(true);

const availabilitySchema = Joi.object({
  lastUpdated: Joi.date().iso().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
  isAvailable: Joi.boolean().required(),
});

export const validateAvailabilityData = (message: AvailabilityChangeData): AvailabilityChangeData => {
  const validationResult = atfSchema.validate(message);
  if (validationResult.error) {
    throw new Error(`Malformed record: ${JSON.stringify(message)}`);
  }

  const {
    id, name, email, token, availability,
  } = message;
  const availabilityValidationResult = availabilitySchema.validate(availability);
  if (availabilityValidationResult.error) {
    throw new Error(`Malformed "availability" field in: ${JSON.stringify(message)}`);
  }

  return {
    id,
    name,
    email,
    token,
    availability,
  };
};
