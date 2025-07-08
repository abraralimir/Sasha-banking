'use client';

import { SashaAvatar } from '@/components/sasha-avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/language-context';
import { PowerOff } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function SashaOffline({ countdown }: { countdown: string }) {
    const { t, dir } = useLanguage();
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.play().catch(error => {
                console.warn("Audio autoplay was prevented by the browser. This is a standard security feature.", error);
            });
        }
    }, []);

    return (
        <main className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
             <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="absolute z-0 w-auto min-w-full min-h-full max-w-none"
                poster="https://placehold.co/1920x1080.png"
                data-ai-hint="abstract background"
             >
                <source src="/offline-bg.mp4.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <audio ref={audioRef} loop>
                <source src="/offline-loop.mp3.mp3" type="audio/mpeg" />
            </audio>
            <div className="absolute inset-0 bg-black/50 z-10"></div>
            
            <Card className="w-full max-w-md text-center shadow-2xl animate-in fade-in-50 duration-500 z-20 bg-black/50 text-white backdrop-blur-lg border border-white/20">
                <CardHeader className="pb-4">
                    <div className="mx-auto flex flex-col items-center gap-4">
                        <SashaAvatar className="w-16 h-16" />
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <PowerOff className="w-6 h-6" />
                            {t('sashaOfflineTitle')}
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-white/80">{t('sashaOfflineDesc')}</p>
                    <div className="text-sm font-semibold bg-white/10 py-2 px-4 rounded-lg border border-white/20">
                        <p className="text-white/90">{t('sashaOnlineAgain')}</p>
                        <p className="text-3xl font-mono tracking-widest mt-1 text-white">{countdown}</p>
                    </div>
                     <p className="text-xs text-white/60 pt-2">{t('sashaOfflineHours')}</p>
                </CardContent>
            </Card>
        </main>
    )
}
