'use client';

import { useState, useEffect } from 'react';

export function useSpreadsheetStatus() {
  const [status, setStatus] = useState({ 
    isOnline: true, 
    countdown: ''
  });

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Break is from 3 PM (15:00) to 5 PM (17:00)
      const isBreakTime = currentHour >= 15 && currentHour < 17;
      const isOnline = !isBreakTime;
      
      let countdown = '';
      if (!isOnline) {
        let targetTime = new Date();
        targetTime.setHours(17, 0, 0, 0); // Target is 5:00 PM today
        
        const distance = targetTime.getTime() - now.getTime();
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        const formatTime = (time: number) => time.toString().padStart(2, '0');
        countdown = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;
      }
      
      setStatus({ isOnline, countdown });
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  return status;
}
