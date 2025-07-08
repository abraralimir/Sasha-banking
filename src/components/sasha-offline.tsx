'use client';

import { SashaAvatar } from '@/components/sasha-avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/language-context';
import { Moon } from 'lucide-react';

export function SashaOffline({ countdown }: { countdown: string }) {
    const { t } = useLanguage();
    return (
        <main className="flex-1 flex items-center justify-center p-4 bg-muted/40">
            <Card className="w-full max-w-md text-center shadow-lg animate-in fade-in-50 duration-500">
                <CardHeader>
                    <div className="mx-auto flex flex-col items-center gap-4">
                        <SashaAvatar className="w-20 h-20" />
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <Moon className="w-6 h-6 text-muted-foreground" />
                            {t('sashaOfflineTitle')}
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{t('sashaOfflineDesc')}</p>
                    <div className="text-sm font-semibold text-primary bg-primary/10 py-2 px-4 rounded-md">
                        <p>{t('sashaOnlineAgain')}</p>
                        <p className="text-2xl font-mono tracking-widest mt-1">{countdown}</p>
                    </div>
                     <p className="text-xs text-muted-foreground">{t('sashaOfflineHours')}</p>
                </CardContent>
            </Card>
        </main>
    )
}
