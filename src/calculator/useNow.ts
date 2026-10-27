import { useEffect, useState } from 'react';

/** The current time in ms, refreshed every minute, so "3 minutes ago" labels stay honest while the app is open. */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
