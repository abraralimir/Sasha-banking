'use client';

import { MessageCircle, Sheet, BookOpen } from 'lucide-react';
import { LanguageToggle } from '@/components/language-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SashaAvatar } from '@/components/sasha-avatar';

export default function LearnPage() {
  const { t, dir } = useLanguage();

  return (
    <div className="flex flex-col h-screen bg-background text-foreground" dir={dir}>
      <header className="grid grid-cols-3 items-center p-4 border-b shrink-0 bg-background/80 backdrop-blur-sm">
        <div className="justify-self-start">
          <SidebarTrigger />
        </div>
        <h1 className="text-xl font-semibold tracking-tight justify-self-center">{t('learnPageTitle')}</h1>
        <div className="justify-self-end">
          <LanguageToggle />
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in-50 duration-500">
          <div className="flex flex-col items-center text-center space-y-4">
            <SashaAvatar className="w-20 h-20" />
            <h2 className="text-3xl font-bold tracking-tight">{t('learnPageTitle')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              {t('learnIntro')}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('learnCapabilitiesTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-5 w-5 text-primary" />
                      <span className="font-semibold">{t('learnChatTitle')}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pl-11">
                    {t('learnChatDesc')}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    <div className="flex items-center gap-3">
                      <Sheet className="h-5 w-5 text-primary" />
                      <span className="font-semibold">{t('learnSpreadsheetTitle')}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pl-11">
                    {t('learnSpreadsheetDesc')}
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-3">
                  <AccordionTrigger>
                    <div className="flex items-center gap-3">
                       <BookOpen className="h-5 w-5 text-primary" />
                      <span className="font-semibold">{t('learnAITitle')}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pl-11">
                    {t('learnAIDesc')}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
