'use client';

import { useSashaStatus } from '@/hooks/use-sasha-status';
import { useLanguage } from '@/context/language-context';

export function SashaStatus() {
    const { isOnline, timeString } = useSashaStatus();
    const { t } = useLanguage();

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
                {isOnline ? timeString : t('sashaStatusOffline')}
            </p>
        </div>
    );
}
