'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/language-context';

export function useSashaStatus() {
  const [status, setStatus] = useState({ 
    isOnline: true, // Default to true to avoid flash of offline content on initial render
    timeString: '',
    countdown: ''
  });
  const { language } = useLanguage();

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Working hours: 5:30 AM to 6:30 PM (18:30)
      const isAfterStartTime = currentHour > 5 || (currentHour === 5 && currentMinute >= 30);
      const isBeforeEndTime = currentHour < 18 || (currentHour === 18 && currentMinute < 30);
      
      const isOnline = isAfterStartTime && isBeforeEndTime;
      
      const timeString = now.toLocaleTimeString(language === 'ar' ? 'ar-OM' : 'en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });

      let countdown = '';
      if (!isOnline) {
        let targetTime = new Date();
        targetTime.setHours(5, 30, 0, 0); // Target is 5:30 AM today

        // If it's already past 5:30 AM, target is 5:30 AM tomorrow
        if (now.getTime() > targetTime.getTime()) {
          targetTime.setDate(targetTime.getDate() + 1);
        }
        
        const distance = targetTime.getTime() - now.getTime();
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        const formatTime = (time: number) => time.toString().padStart(2, '0');
        countdown = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;
      }
      
      setStatus({ isOnline, timeString, countdown });
    };

    checkStatus(); // Initial check
    const interval = setInterval(checkStatus, 1000); // Check every second for the countdown

    return () => clearInterval(interval);
  }, [language]);

  return status;
}
