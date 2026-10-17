const clockTime = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
const calendarDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (time: number) => {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export const formatSeconds = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${String(seconds)} s`;
  if (seconds === 0) return `${String(minutes)} min`;
  return `${String(minutes)} min ${String(seconds)} s`;
};

export const formatClock = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes)}:${String(seconds).padStart(2, '0')}`;
};

export const formatTimeLimits = (
  timeLimitSeconds: number | null,
  perQuestionSeconds: number | null
): [main: string, detail: string] => {
  if (timeLimitSeconds !== null && perQuestionSeconds !== null) {
    return [`${formatSeconds(timeLimitSeconds)} overall`, `${formatSeconds(perQuestionSeconds)} per question`];
  }
  if (timeLimitSeconds !== null) return [formatSeconds(timeLimitSeconds), 'for the whole quiz'];
  if (perQuestionSeconds !== null) return [formatSeconds(perQuestionSeconds), 'for each question'];
  return ['No limit', 'untimed'];
};

export const formatDateTime = (isoDate: string, now = Date.now()) => {
  const time = Date.parse(isoDate);
  const daysAgo = Math.round((startOfDay(now) - startOfDay(time)) / DAY_MS);
  const clock = clockTime.format(time);

  if (daysAgo === 0) return `today, ${clock}`;
  if (daysAgo === 1) return `yesterday, ${clock}`;
  return `${calendarDate.format(time)}, ${clock}`;
};

export const greetingFor = (hour: number) => {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};
