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

      // Define working hours and breaks
      const isBreakTime = currentMinute >= 45;
      const inMorningSession = currentHour >= 3 && currentHour < 12;
      const inAfternoonSession = currentHour >= 15 && currentHour < 18;

      const isOnline = (inMorningSession || inAfternoonSession) && !isBreakTime;
      
      let countdown = '';
      if (!isOnline) {
        let targetTime = new Date();
        
        // Currently in a 15-minute break within working hours
        if ((inMorningSession || inAfternoonSession) && isBreakTime) {
          targetTime.setHours(currentHour + 1, 0, 0, 0);
        } 
        // Currently in the lunch break (12:00 PM to 2:59 PM)
        else if (currentHour >= 12 && currentHour < 15) {
          targetTime.setHours(15, 0, 0, 0);
        }
        // After hours (from 6 PM onwards) or early morning (before 3 AM)
        else {
          targetTime.setHours(3, 0, 0, 0);
          // If it's already past 3 AM today (i.e., we are in the after-hours part of the day)
          if (now.getTime() > targetTime.getTime()) {
            targetTime.setDate(targetTime.getDate() + 1);
          }
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
