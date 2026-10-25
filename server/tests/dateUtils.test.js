const { localDateTimeToUtc, dateKeyInTimezone } = require('../utils/dateUtils');

describe('timezone helpers', () => {
  test('converts local reminder time to a UTC instant', () => {
    expect(localDateTimeToUtc('2026-10-25', '08:00', 'Asia/Kolkata').toISOString()).toBe('2026-10-25T02:30:00.000Z');
  });

  test('derives the local date around a UTC day boundary', () => {
    expect(dateKeyInTimezone(new Date('2026-10-24T20:00:00.000Z'), 'Asia/Kolkata')).toBe('2026-10-25');
  });
});
