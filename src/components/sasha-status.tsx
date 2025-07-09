'use client';

import { useSashaStatus } from '@/hooks/use-sasha-status';
import { useLanguage } from '@/context/language-context';
import { useState, useEffect } from 'react';

export function SashaStatus({ isOnline: isOnlineProp, timeString: timeStringProp }: { isOnline?: boolean, timeString?: string }) {
    const { isOnline: sashaIsOnline, timeString: sashaTimeString } = useSashaStatus();
    const { t } = useLanguage();
    const [hasMounted, setHasMounted] = useState(false);

    const isOnline = isOnlineProp !== undefined ? isOnlineProp : sashaIsOnline;
    const timeString = timeStringProp !== undefined ? timeStringProp : sashaTimeString;

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) {
        return (
            <div className="flex items-center space-x-2 rtl:space-x-reverse h-5 w-24">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-3 w-3">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-muted"></span>
                </span>
              </div>
            </div>
        );
    }

    return (
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="flex items-center space-x-2">
                <span className="relative flex h-3 w-3">
                  {isOnline ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </>
                  ) : (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </>
                  )}
                </span>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
                {isOnline ? (timeString || t('sashaStatusOnline')) : t('sashaStatusOffline')}
            </p>
        </div>
    );
}
