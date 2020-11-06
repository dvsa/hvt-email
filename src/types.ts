import type { Template } from 'nunjucks';

export interface Availability {
  lastUpdated: string,
  startDate: string,
  endDate: string,
  isAvailable: boolean,
}

export interface TokenPair {
  yes: string,
  no: string,
}

export interface ATF {
  id: string,
  name: string,
  email: string,
  tokens: TokenPair,
  [key: string]: unknown,
}

export type AvailabilityChangeData = {
  oldAvailability?: Availability,
  newAvailability?: Availability,
} & ATF;

export interface BuildEmailBodyParams {
  availableTemplate: Template,
  fullyBookedTemplate: Template,
  atfName: string,
  availability: Availability,
  tokens: TokenPair,
  emailLinkBaseUrl: string,
}
