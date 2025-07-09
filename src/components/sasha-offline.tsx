
'use client';

import { SashaAvatar } from '@/components/sasha-avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/language-context';
import { PowerOff, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function SashaOffline({
    title,
    description,
    hours,
    countdown,
}: {
    title?: string;
    description?: string;
    hours?: string;
    countdown: string;
}) {
    const { t, dir } = useLanguage();
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.muted = true; // Start muted to allow autoplay
            audio.play().catch(error => {
                console.warn("Audio autoplay was prevented. User interaction is needed.", error);
            });
        }
    }, []);

    const toggleMute = () => {
        const audio = audioRef.current;
        if (audio) {
            const shouldBeMuted = !audio.muted;
            audio.muted = shouldBeMuted;
            setIsMuted(shouldBeMuted);
            // If we are unmuting and the audio is somehow paused, play it.
            if (!shouldBeMuted && audio.paused) {
                audio.play().catch(e => console.error("Could not play audio on unmute:", e));
            }
        }
    };

    return (
        <div className="relative w-full h-full">
             <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="absolute inset-0 w-full h-full z-0 object-cover"
                poster="https://placehold.co/1920x1080.png"
                data-ai-hint="abstract background"
             >
                <source src="/offline-bg.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <audio ref={audioRef} loop>
                <source src="/offline-loop.mp3" type="audio/mpeg" />
            </audio>
            <div className="absolute inset-0 bg-black/40 z-10"></div>
            
             <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="absolute top-4 right-4 z-30 text-white/70 hover:text-white hover:bg-white/20"
                aria-label="Toggle Sound"
            >
                {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </Button>
            
            <div className="relative z-20 flex items-center justify-center h-full p-4">
                <Card className="w-full max-w-md text-center shadow-2xl animate-in fade-in-50 duration-500 bg-black/50 backdrop-blur-lg border border-white/20">
                    <CardHeader className="pb-4">
                        <div className="mx-auto flex flex-col items-center gap-4">
                            <SashaAvatar className="w-16 h-16" />
                            <CardTitle className="text-2xl flex items-center gap-2 text-white/90">
                                <PowerOff className="w-6 h-6" />
                                {title || t('sashaOfflineTitle')}
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-white/80 text-sm max-w-xs mx-auto leading-relaxed">{description || t('sashaOfflineDesc')}</p>
                        <div className="text-sm font-semibold bg-white/10 py-3 px-4 rounded-lg border border-white/20">
                            <p className="text-white/90 text-xs font-sans tracking-wide uppercase">{hours || t('sashaOnlineAgain')}</p>
                            <p className="text-4xl font-mono tracking-widest mt-1 text-white">{countdown}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
