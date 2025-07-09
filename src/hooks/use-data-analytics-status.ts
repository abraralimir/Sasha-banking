'use client';

import { useState, useEffect } from 'react';

export function useDataAnalyticsStatus() {
  const [status, setStatus] = useState({ 
    isOnline: true, 
    countdown: ''
  });

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Working hours: 3 AM to 5 PM (17:00), with a 15-minute break at the end of every hour.
      // Online if hour is between 3 and 16, and minute is between 0 and 44.
      const isWithinHours = currentHour >= 3 && currentHour < 17;
      const isWithinMinutes = currentMinute < 45;
      
      const isOnline = isWithinHours && isWithinMinutes;
      
      let countdown = '';
      if (!isOnline) {
        let targetTime = new Date();
        
        // If outside the 3 AM - 5 PM window
        if (currentHour < 3 || currentHour >= 17) {
          targetTime.setHours(3, 0, 0, 0);
          // If it's already past 3 AM today, target is 3 AM tomorrow
          if (now.getTime() > targetTime.getTime()) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
        } else { // Must be in a 15-minute break (e.g., at 3:45, 4:45, etc.)
          targetTime.setHours(currentHour + 1, 0, 0, 0);
        }
        
        const distance = targetTime.getTime() - now.getTime();
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        const formatTime = (time: number) => time.toString().padStart(2, '0');
        countdown = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;
      }
      
      setStatus({ isOnline, countdown });
    };

    checkStatus(); // Initial check
    const interval = setInterval(checkStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  return status;
}
