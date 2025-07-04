'use client';

import { MessageCircle, Sheet, BookOpen, Rocket, Wand, ListChecks } from 'lucide-react';
import { LanguageToggle } from '@/components/language-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SashaAvatar } from '@/components/sasha-avatar';
import { cn } from '@/lib/utils';

export default function LearnPage() {
  const { t, dir } = useLanguage();

  const capabilities = [
    {
      icon: MessageCircle,
      title: t('learnChatTitle'),
      description: t('learnChatDesc'),
    },
    {
      icon: Sheet,
      title: t('learnSpreadsheetTitle'),
      description: t('learnSpreadsheetDesc'),
    },
    {
      icon: Wand,
      title: t('learnAITitle'),
      description: t('learnAIDesc'),
    },
  ];

  const gettingStartedSteps = [
    {
      title: t('gsChatStepTitle'),
      description: t('gsChatStepDesc'),
    },
    {
      title: t('gsSpreadsheetStepTitle'),
      description: t('gsSpreadsheetStepDesc'),
    },
  ];

  const comingSoonFeatures = [
    t('csFeature1'),
    t('csFeature2'),
    t('csFeature3'),
    t('csFeature4'),
  ];

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
                {capabilities.map((item, index) => (
                    <AccordionItem value={`item-${index + 1}`} key={index}>
                        <AccordionTrigger>
                            <div className="flex items-center gap-3">
                            <item.icon className="h-5 w-5 text-primary" />
                            <span className="font-semibold">{item.title}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pl-11">
                            {item.description}
                        </AccordionContent>
                    </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle>{t('gettingStartedTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {gettingStartedSteps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">{index + 1}</div>
                        <div className="space-y-1">
                            <h3 className="font-semibold">{step.title}</h3>
                            <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: step.description }} />
                        </div>
                    </div>
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('comingSoonTitle')}</CardTitle>
              <CardDescription>{t('comingSoonDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {comingSoonFeatures.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3">
                            <Rocket className="w-5 h-5 text-primary/70"/>
                            <span className="text-muted-foreground">{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
