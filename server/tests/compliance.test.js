const { calculateCompliance } = require('../services/complianceService');

describe('calculateCompliance', () => {
  test('counts only taken and missed eligible doses', () => {
    const logs = [
      { status: 'taken', scheduledAt: new Date(Date.now() - 3600000) },
      { status: 'missed', scheduledAt: new Date(Date.now() - 1800000) },
      { status: 'upcoming', scheduledAt: new Date(Date.now() - 1000) },
      { status: 'missed', scheduledAt: new Date(Date.now() + 3600000) },
    ];
    expect(calculateCompliance(logs)).toBe(50);
  });

  test('handles empty and unresolved schedules without NaN', () => {
    expect(calculateCompliance([])).toBe(100);
    expect(calculateCompliance([{ status: 'upcoming', scheduledAt: new Date(Date.now() + 60000) }])).toBe(100);
  });
});
