import { useEffect, useEffectEvent, useRef, useState } from 'react';

const TICK_MS = 250;
const WARNING_SECONDS = [10, 30];

interface CountdownOptions {
  deadlineAt: number | null;
  limitSeconds: number | null;
  onExpire: () => void;
}

const announcementFor = (remainingMs: number | null, limitSeconds: number | null) => {
  if (remainingMs === null || limitSeconds === null || remainingMs <= 0) return '';
  const warning = WARNING_SECONDS.find(seconds => remainingMs <= seconds * 1000 && limitSeconds > seconds);
  return warning === undefined ? '' : `${String(warning)} seconds left`;
};

export const useCountdown = ({ deadlineAt, limitSeconds, onExpire }: CountdownOptions) => {
  const [now, setNow] = useState(Date.now);
  const expiredFor = useRef<number | null>(null);
  const expire = useEffectEvent(onExpire);

  useEffect(() => {
    if (deadlineAt === null) return;

    const checkExpiry = (time: number) => {
      if (time >= deadlineAt && expiredFor.current !== deadlineAt) {
        expiredFor.current = deadlineAt;
        expire();
      }
    };

    const tick = () => {
      const time = Date.now();
      setNow(time);
      checkExpiry(time);
    };

    checkExpiry(Date.now());
    const interval = setInterval(tick, TICK_MS);
    document.addEventListener('visibilitychange', tick);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [deadlineAt]);

  const remainingMs = deadlineAt === null ? null : Math.max(0, deadlineAt - now);

  return { remainingMs, announcement: announcementFor(remainingMs, limitSeconds) };
};
