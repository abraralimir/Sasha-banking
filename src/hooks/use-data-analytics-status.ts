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
      const currentTime = currentHour * 60 + currentMinute;

      // Define working hours in minutes from midnight
      const morningSessionStart = 5 * 60 + 30; // 5:30 AM
      const morningSessionEnd = 10 * 60; // 10:00 AM

      const noonSessionStart = 12 * 60; // 12:00 PM
      const noonSessionEnd = 15 * 60; // 3:00 PM
      
      const eveningSessionStart = 19 * 60; // 7:00 PM
      const eveningSessionEnd = 22 * 60; // 10:00 PM

      const inMorningSession = currentTime >= morningSessionStart && currentTime < morningSessionEnd;
      const inNoonSession = currentTime >= noonSessionStart && currentTime < noonSessionEnd;
      const inEveningSession = currentTime >= eveningSessionStart && currentTime < eveningSessionEnd;

      const isOnline = inMorningSession || inNoonSession || inEveningSession;
      
      let countdown = '';
      if (!isOnline) {
        let targetTime = new Date();
        let nextSessionStart: number;

        if (currentTime < morningSessionStart) { // Before first session
          nextSessionStart = morningSessionStart;
        } else if (currentTime >= morningSessionEnd && currentTime < noonSessionStart) { // Break 1
          nextSessionStart = noonSessionStart;
        } else if (currentTime >= noonSessionEnd && currentTime < eveningSessionStart) { // Break 2
          nextSessionStart = eveningSessionStart;
        } else { // After last session for today
          nextSessionStart = morningSessionStart;
          targetTime.setDate(targetTime.getDate() + 1); // Target is tomorrow
        }
        
        targetTime.setHours(Math.floor(nextSessionStart / 60), nextSessionStart % 60, 0, 0);
        
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
