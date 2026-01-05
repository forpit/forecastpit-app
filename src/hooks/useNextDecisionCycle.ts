import { useState, useEffect } from "react";

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  nextDate: Date;
  isToday: boolean;
}

function getNextDecisionCycle(): Date {
  const now = new Date();
  const utcNow = new Date(now.toISOString());

  // Decision cycles: Monday (1), Wednesday (3), Friday (5) at 00:00 UTC
  const decisionDays = [1, 3, 5];

  // Start from today at 00:00 UTC
  const today = new Date(Date.UTC(
    utcNow.getUTCFullYear(),
    utcNow.getUTCMonth(),
    utcNow.getUTCDate(),
    0, 0, 0, 0
  ));

  // Check today and next 7 days
  for (let i = 0; i <= 7; i++) {
    const checkDate = new Date(today);
    checkDate.setUTCDate(checkDate.getUTCDate() + i);

    const dayOfWeek = checkDate.getUTCDay();

    if (decisionDays.includes(dayOfWeek)) {
      // If it's today, check if we've passed 00:00 UTC
      if (i === 0 && utcNow >= checkDate) {
        continue; // Already passed today's cycle
      }
      return checkDate;
    }
  }

  // Fallback (should never reach)
  return today;
}

function calculateTimeLeft(targetDate: Date): CountdownTime {
  const now = new Date();
  const difference = targetDate.getTime() - now.getTime();

  const isToday = difference < 24 * 60 * 60 * 1000 && difference > 0;

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      nextDate: targetDate,
      isToday: false,
    };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    nextDate: targetDate,
    isToday,
  };
}

export function useNextDecisionCycle(): CountdownTime {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>(() =>
    calculateTimeLeft(getNextDecisionCycle())
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const nextCycle = getNextDecisionCycle();
      setTimeLeft(calculateTimeLeft(nextCycle));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return timeLeft;
}

export function formatDecisionDay(date: Date): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getUTCDay()];
}
