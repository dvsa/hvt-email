import type { DynamoDBRecord } from 'aws-lambda';

import { extractAvailabilityData, availabilityHasChanged } from '../../src/lib/availability';

describe('extractAvailabilityData()', () => {
  it('extracts the availability data as expected', () => {
    const testCases = [
      {
        record: {
          dynamodb: {
            OldImage: {
              availability: {
                M: {
                  isAvailable: { BOOL: true },
                  lastUpdated: { S: '2020-10-09T12:31:46.518Z' },
                  endDate: { S: '2020-11-03T14:21:45.000Z' },
                  startDate: { S: '2020-10-06T14:21:45.000Z' },
                },
              },
            },
            NewImage: {
              availability: {
                M: {
                  isAvailable: { BOOL: false },
                  lastUpdated: { S: '2020-10-09T12:31:46.518Z' },
                  endDate: { S: '2020-11-03T14:21:45.000Z' },
                  startDate: { S: '2020-10-06T14:21:45.000Z' },
                },
              },
            },
          },
        } as DynamoDBRecord,
        expected: {
          oldAvailability: {
            isAvailable: true,
            lastUpdated: '2020-10-09T12:31:46.518Z',
            endDate: '2020-11-03T14:21:45.000Z',
            startDate: '2020-10-06T14:21:45.000Z',
          },
          newAvailability: {
            isAvailable: false,
            lastUpdated: '2020-10-09T12:31:46.518Z',
            endDate: '2020-11-03T14:21:45.000Z',
            startDate: '2020-10-06T14:21:45.000Z',
          },
        },
      },
    ];

    testCases.forEach(({ record, expected }) => {
      expect(extractAvailabilityData(record)).toEqual(expected);
    });
  });
});

describe('availabilityHasChanged()', () => {
  it('detects when availability has changed', () => {
    const testCases = [
      // false > true
      {
        oldAvailability: {
          lastUpdated: '2020-10-19T16:01:28.832Z',
          startDate: '2020-10-19T16:01:28.832Z',
          endDate: '2020-10-26T16:01:28.832Z',
          isAvailable: false,
        },
        newAvailability: {
          lastUpdated: '2020-10-19T16:01:28.832Z',
          startDate: '2020-10-19T16:01:28.832Z',
          endDate: '2020-10-26T16:01:28.832Z',
          isAvailable: true,
        },
      },
      // true > false
      {
        oldAvailability: {
          lastUpdated: '2020-10-19T16:01:28.832Z',
          startDate: '2020-10-19T16:01:28.832Z',
          endDate: '2020-10-26T16:01:28.832Z',
          isAvailable: true,
        },
        newAvailability: {
          lastUpdated: '2020-10-19T16:01:28.832Z',
          startDate: '2020-10-19T16:01:28.832Z',
          endDate: '2020-10-26T16:01:28.832Z',
          isAvailable: false,
        },
      },
      // true > true, different dates
      {
        oldAvailability: {
          lastUpdated: '2020-10-19T16:01:28.832Z',
          startDate: '2020-10-19T16:01:28.832Z',
          endDate: '2020-10-26T16:01:28.832Z',
          isAvailable: true,
        },
        newAvailability: {
          lastUpdated: '2020-11-19T16:01:28.832Z',
          startDate: '2020-11-19T16:01:28.832Z',
          endDate: '2020-11-26T16:01:28.832Z',
          isAvailable: true,
        },
      },
      // false > false, different dates
      {
        oldAvailability: {
          lastUpdated: '2020-10-19T16:01:28.832Z',
          startDate: '2020-10-19T16:01:28.832Z',
          endDate: '2020-10-26T16:01:28.832Z',
          isAvailable: false,
        },
        newAvailability: {
          lastUpdated: '2020-11-19T16:01:28.832Z',
          startDate: '2020-11-19T16:01:28.832Z',
          endDate: '2020-11-26T16:01:28.832Z',
          isAvailable: false,
        },
      },
    ];

    testCases.forEach(({ oldAvailability, newAvailability }) => {
      expect(availabilityHasChanged(oldAvailability, newAvailability)).toEqual(true);
    });
  });

  it('detected when availability has not changed', () => {
    const testCases = [
      {
        oldAvailability: {
          lastUpdated: '2020-10-19T16:01:28.832Z',
          startDate: '2020-10-19T16:01:28.832Z',
          endDate: '2020-10-26T16:01:28.832Z',
          isAvailable: false,
        },
        newAvailability: {
          lastUpdated: '2020-10-19T16:01:28.832Z',
          startDate: '2020-10-19T16:01:28.832Z',
          endDate: '2020-10-26T16:01:28.832Z',
          isAvailable: false,
        },
      },
    ];

    testCases.forEach(({ oldAvailability, newAvailability }) => {
      expect(availabilityHasChanged(oldAvailability, newAvailability)).toEqual(false);
    });
  });

  it('detects when availability data was deleted', () => {
    const testCases = [
      {
        oldAvailability: {
          lastUpdated: '2020-10-19T16:01:28.832Z',
          startDate: '2020-10-19T16:01:28.832Z',
          endDate: '2020-10-26T16:01:28.832Z',
          isAvailable: false,
        },
        newAvailability: undefined,
      },
    ];

    testCases.forEach(({ oldAvailability, newAvailability }) => {
      expect(availabilityHasChanged(oldAvailability, newAvailability)).toEqual(false);
    });
  });

  it('detects when availability data is added for the first time', () => {
    const testCases = [
      {
        oldAvailability: undefined,
        newAvailability: {
          lastUpdated: '2020-10-19T16:01:28.832Z',
          startDate: '2020-10-19T16:01:28.832Z',
          endDate: '2020-10-26T16:01:28.832Z',
          isAvailable: false,
        },
      },
    ];

    testCases.forEach(({ oldAvailability, newAvailability }) => {
      expect(availabilityHasChanged(oldAvailability, newAvailability)).toEqual(true);
    });
  });

  it('ignores changes to items with no availability data before and after the change', () => {
    const testCases = [
      {
        oldAvailability: undefined,
        newAvailability: undefined,
      },
    ];

    testCases.forEach(({ oldAvailability, newAvailability }) => {
      expect(availabilityHasChanged(oldAvailability, newAvailability)).toEqual(false);
    });
  });
});
