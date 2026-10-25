const dateKeyInTimezone = (date = new Date(), timeZone = 'UTC') => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
};

const localDateTimeToUtc = (dateKey, time, timeZone = 'UTC') => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = desiredUtc;
  for (let i = 0; i < 3; i += 1) {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(candidate));
    const value = Object.fromEntries(parts.map(part => [part.type, Number(part.value)]));
    const representedUtc = Date.UTC(value.year, value.month - 1, value.day, value.hour, value.minute);
    candidate += desiredUtc - representedUtc;
  }
  return new Date(candidate);
};

const dateKeyToUtcMidnight = key => new Date(`${key}T00:00:00.000Z`);
module.exports = { dateKeyInTimezone, localDateTimeToUtc, dateKeyToUtcMidnight };
