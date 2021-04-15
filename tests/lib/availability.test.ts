import { validateAvailabilityData } from '../../src/lib/availability';
import { AvailabilityChangeData } from '../../src/types';

jest.unmock('../../src/lib/availability');
jest.unmock('joi');

describe('validateAvailabilityData()', () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdGFydERhdGUiOjE2MDI4NzM0NjQsImVuZERhdGU'
      + 'iOjE2MDUyOTI2NjQsImlzQXZhaWxhYmxlIjp0cnVlLCJpYXQiOjE2MDI4NzM0NjQsImV4cCI6MTYwMzQ3ODI2NCwiaX'
      + 'NzIjoiaHR0cHM6Ly9ib29rLWhndi1idXMtdHJhaWxlci1tb3Quc2VydmljZS5nb3YudWsiLCJzdWIiOiJlMWQ4NzgxO'
      + 'C00YTk3LTQ4NmItYmU4NS1mZDFlY2U4MGJjMzAifQ.-RLsz-87tLDMhLopcJq4wyXs0ySLUd9PzGhmzAtUt8k';
  let testCase: AvailabilityChangeData;

  beforeEach(() => {
    testCase = {
      id: '7db12eed-0c3f-4d27-8221-5699f4e3ea22',
      name: 'Derby Cars Ltd.',
      email: 'hello@email.com',
      token,
      availability: {
        isAvailable: true,
        lastUpdated: '2020-10-09T12:31:46.518Z',
        endDate: '2020-11-03T14:21:45.000Z',
        startDate: '2020-10-06T14:21:45.000Z',
      },
    };
  });

  it('returns the availability data as expected if validation passes', () => {
    expect(validateAvailabilityData(testCase)).toEqual(testCase);
  });

  it('detects when the ATF email is in an unexpected format', () => {
    testCase.email = '### INVALID EMAIL ADDRESS ###';
    expect(() => {
      validateAvailabilityData(testCase);
    }).toThrowError();
  });

  it('detects when the ATF ID is in an unexpected format', () => {
    testCase.id = '1a7c1d1a-8e52-11eb-8dcd-0242ac1300034'; // invalid uuid
    expect(() => {
      validateAvailabilityData(testCase);
    }).toThrowError();
  });

  it('detects when the ATF ID is missing', () => {
    delete testCase.id;
    expect(() => {
      validateAvailabilityData(testCase);
    }).toThrowError();
  });

  it('detects when the ATF name is missing', () => {
    delete testCase.name;
    expect(() => {
      validateAvailabilityData(testCase);
    }).toThrowError();
  });

  it('detects when the ATF email is missing', () => {
    delete testCase.email;
    expect(() => {
      validateAvailabilityData(testCase);
    }).toThrowError();
  });

  it('detects when the ATF token is missing', () => {
    delete testCase.token;
    expect(() => {
      validateAvailabilityData(testCase);
    }).toThrowError();
  });

  it('detects when the ATF availability last updated is in an unexpected format', () => {
    testCase.availability.lastUpdated = 'Monday';
    expect(() => {
      validateAvailabilityData(testCase);
    }).toThrowError();
  });

  it('detects when the ATF availability last updated is missing', () => {
    delete testCase.availability.lastUpdated;
    expect(() => {
      validateAvailabilityData(testCase);
    }).toThrowError();
  });

  it('detects when the ATF availability end date is in an unexpected format', () => {
    testCase.availability.endDate = 'Monday';
    expect(() => {
      validateAvailabilityData(testCase);
    }).toThrowError();
  });

  it('detects when the ATF availability end date is missing', () => {
    delete testCase.availability.endDate;
    expect(() => {
      validateAvailabilityData(testCase);
    }).toThrowError();
  });

  it('detects when the ATF availability start date is in an unexpected format', () => {
    testCase.availability.startDate = 'Monday';
    expect(() => {
      validateAvailabilityData(testCase);
    }).toThrowError();
  });

  it('detects when the ATF availability start date is missing', () => {
    delete testCase.availability.startDate;
    expect(() => {
      validateAvailabilityData(testCase);
    }).toThrowError();
  });

  it('detects when the ATF availability start date is missing', () => {
    delete testCase.availability.isAvailable;
    expect(() => {
      validateAvailabilityData(testCase);
    }).toThrowError();
  });
});
