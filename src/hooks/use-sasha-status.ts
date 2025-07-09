'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/language-context';

export function useSashaStatus() {
  const [status, setStatus] = useState({ 
    isOnline: true,
    timeString: '',
    countdown: ''
  });
  const { language } = useLanguage();

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;

      // Define working hours in minutes from midnight
      const morningSessionStart = 5 * 60 + 30; // 5:30 AM
      const morningSessionEnd = 13 * 60; // 1:00 PM

      const afternoonSessionStart = 14 * 60; // 2:00 PM
      const afternoonSessionEnd = 17 * 60; // 5:00 PM
      
      const eveningSessionStart = 19 * 60; // 7:00 PM
      const eveningSessionEnd = 22 * 60; // 10:00 PM

      const inMorningSession = currentTime >= morningSessionStart && currentTime < morningSessionEnd;
      const inAfternoonSession = currentTime >= afternoonSessionStart && currentTime < afternoonSessionEnd;
      const inEveningSession = currentTime >= eveningSessionStart && currentTime < eveningSessionEnd;

      const isOnline = inMorningSession || inAfternoonSession || inEveningSession;
      
      const timeString = now.toLocaleTimeString(language === 'ar' ? 'ar-OM' : 'en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });

      let countdown = '';
      if (!isOnline) {
        let targetTime = new Date();
        let nextSessionStart: number;

        if (currentTime < morningSessionStart) { // Before first session today
          nextSessionStart = morningSessionStart;
        } else if (currentTime >= morningSessionEnd && currentTime < afternoonSessionStart) { // Between morning and afternoon
          nextSessionStart = afternoonSessionStart;
        } else if (currentTime >= afternoonSessionEnd && currentTime < eveningSessionStart) { // Between afternoon and evening
          nextSessionStart = eveningSessionStart;
        } else { // After all sessions for today
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
      
      setStatus({ isOnline, timeString, countdown });
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1000);

    return () => clearInterval(interval);
  }, [language]);

  return status;
}
