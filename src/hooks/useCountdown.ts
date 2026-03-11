import { useState, useEffect, useRef } from 'react';

interface CountdownResult {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

function calculateTimeLeft(target: Date): CountdownResult {
    const diff = Math.max(0, target.getTime() - Date.now());
    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
    };
}

export function useCountdown(targetDate: Date): CountdownResult {
    const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        setTimeLeft(calculateTimeLeft(targetDate));

        intervalRef.current = setInterval(() => {
            setTimeLeft(calculateTimeLeft(targetDate));
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [targetDate]);

    return timeLeft;
}
