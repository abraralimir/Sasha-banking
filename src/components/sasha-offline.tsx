'use client';

import { SashaAvatar } from '@/components/sasha-avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/language-context';
import { Moon } from 'lucide-react';

export function SashaOffline({ countdown }: { countdown: string }) {
    const { t, dir } = useLanguage();
    return (
        <main className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
             <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="absolute z-0 inset-0 w-full h-full object-cover"
                poster="https://placehold.co/1920x1080.png"
                data-ai-hint="abstract background"
             >
                <source src="/offline-bg.mp4.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <audio autoPlay loop>
                <source src="/offline-loop.mp3.mp3" type="audio/mpeg" />
            </audio>
            <div className="absolute inset-0 bg-black/60 z-10"></div>
            
            <Card className="w-full max-w-md text-center shadow-2xl animate-in fade-in-50 duration-500 z-20 bg-background/80 text-foreground backdrop-blur-xl border border-border">
                <CardHeader>
                    <div className="mx-auto flex flex-col items-center gap-4">
                        <SashaAvatar className="w-20 h-20" />
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <Moon className="w-6 h-6" />
                            {t('sashaOfflineTitle')}
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{t('sashaOfflineDesc')}</p>
                    <div className="text-sm font-semibold bg-muted/90 py-2 px-4 rounded-md border text-foreground">
                        <p>{t('sashaOnlineAgain')}</p>
                        <p className="text-2xl font-mono tracking-widest mt-1">{countdown}</p>
                    </div>
                     <p className="text-xs text-muted-foreground">{t('sashaOfflineHours')}</p>
                </CardContent>
            </Card>
        </main>
    )
}
