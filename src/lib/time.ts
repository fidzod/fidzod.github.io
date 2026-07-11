export const getLocalTimeString = (
  timeZone: string = 'Europe/London'
): string => {
  const now = new Date();

  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // Get the UTC offset by comparing formatted parts in the target zone
  const offsetFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset'
  });

  const parts = offsetFormatter.formatToParts(now);
  const offsetPart =
    parts.find((p) => p.type === 'timeZoneName')?.value ?? 'UTC+0';

  // offsetPart looks like "GMT+1" or "GMT+1:30" — normalize to "+01:00"
  const match = offsetPart.match(/GMT([+-])(\d+)(?::(\d+))?/);
  let offsetString = '+00:00';
  if (match) {
    const [, sign, h, m = '0'] = match;
    offsetString = `${sign}${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
  }

  return `${timeFormatter.format(now)} (UTC ${offsetString})`;
};
