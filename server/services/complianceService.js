/**
 * Single Source of Truth Compliance Calculator
 * compliance% = (taken doses / (taken doses + missed doses)) * 100
 * 
 * Rules:
 * - Excludes upcoming and snoozed doses from denominator.
 * - Excludes doses scheduled in the future.
 * - Returns 100 if there are no resolved doses yet (taken + missed = 0).
 */
const calculateCompliance = (logs) => {
  if (!logs || !Array.isArray(logs) || logs.length === 0) {
    return 100;
  }

  const now = new Date();

  let takenCount = 0;
  let missedCount = 0;

  for (const log of logs) {
    // Check if scheduled date/time is in the future
    const sDate = new Date(log.scheduledDate);
    if (log.scheduledTime) {
      const [hours, minutes] = log.scheduledTime.split(':').map(Number);
      sDate.setHours(hours, minutes, 0, 0);
    } else {
      sDate.setHours(23, 59, 59, 999);
    }

    // Ignore future doses
    if (sDate > now) {
      continue;
    }

    if (log.status === 'taken') {
      takenCount++;
    } else if (log.status === 'missed') {
      missedCount++;
    }
    // 'upcoming' and 'snoozed' are excluded from the resolved denominator
  }

  const totalResolved = takenCount + missedCount;
  if (totalResolved === 0) {
    return 100;
  }

  const compliance = (takenCount / totalResolved) * 100;
  return Math.round(compliance * 10) / 10; // 1 decimal place precision
};

module.exports = {
  calculateCompliance,
};
