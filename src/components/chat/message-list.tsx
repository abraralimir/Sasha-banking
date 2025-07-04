'use client';

import { useEffect, useRef } from 'react';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SashaAvatar } from '@/components/sasha-avatar';
import { User, Download } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/language-context';
import { FinancialReportChart } from './financial-report-chart';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  analysisReport?: {
    summary: string;
    prediction: string;
    eligibility: string;
    loanId: string;
  };
  financialReport?: {
    summary: string;
    trendsAndGraphs: string;
    prediction: string;
    creditScorePrediction: string;
    identifiedFlaws: string[];
    keyMetrics: {
      name: string;
      revenue?: number;
      netIncome?: number;
    }[];
  };
};

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onDownloadLoanPdf: (report: Message['analysisReport']) => void;
  onDownloadFinancialReportPdf: (report: Message['financialReport']) => void;
}

export function MessageList({ messages, isLoading, onDownloadLoanPdf, onDownloadFinancialReportPdf }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message} 
            onDownloadLoanPdf={onDownloadLoanPdf}
            onDownloadFinancialReportPdf={onDownloadFinancialReportPdf}
          />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}

function ChatMessage({ 
  message, 
  onDownloadLoanPdf,
  onDownloadFinancialReportPdf
}: { 
  message: Message, 
  onDownloadLoanPdf: (report: Message['analysisReport']) => void; 
  onDownloadFinancialReportPdf: (report: Message['financialReport']) => void; 
}) {
  const { t } = useLanguage();
  const isAssistant = message.role === 'assistant';
  
  return (
    <div
      className={cn('flex items-start gap-4 animate-in fade-in', {
        'justify-end': !isAssistant,
      })}
    >
      {isAssistant && <SashaAvatar className="w-8 h-8 shrink-0" />}
      <div className="max-w-[75%] space-y-2">
        {message.content && (
          <div
            className={cn(
              'rounded-lg p-3 text-sm shadow-sm',
              {
                'bg-card text-card-foreground': !isAssistant,
                'bg-primary text-primary-foreground': isAssistant,
              }
            )}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        )}
        
        {message.imageUrl && (
          <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border bg-muted">
            <NextImage
              src={message.imageUrl}
              alt={message.content || 'Generated image'}
              fill
              className="object-cover"
              data-ai-hint="generative art"
            />
          </div>
        )}

        {message.analysisReport && (
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-base">{t('loanAnalysisReportTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold mb-1">{t('summary')}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{message.analysisReport.summary}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">{t('prediction')}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{message.analysisReport.prediction}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">{t('eligibility')}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{message.analysisReport.eligibility}</p>
              </div>
              <Button onClick={() => onDownloadLoanPdf(message.analysisReport)} variant="secondary" size="sm">
                <Download className="mr-2 h-4 w-4" />
                {t('downloadPdf')}
              </Button>
            </CardContent>
          </Card>
        )}

        {message.financialReport && (
          <>
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-base">{t('financialAnalysisReportTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-1">{t('summary')}</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{message.financialReport.summary}</p>
                </div>
                {message.financialReport.trendsAndGraphs && (
                  <div>
                    <h3 className="font-semibold mb-1">{t('trendsAndGraphsTitle')}</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{message.financialReport.trendsAndGraphs}</p>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold mb-1">{t('prediction')}</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{message.financialReport.prediction}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t('creditScoreAssessment')}</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{message.financialReport.creditScorePrediction}</p>
                </div>
                {message.financialReport.identifiedFlaws && message.financialReport.identifiedFlaws.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-1">{t('identifiedFlawsTitle')}</h3>
                    <ul className="list-none space-y-2 pl-0">
                      {message.financialReport.identifiedFlaws.map((flaw, index) => (
                        <li key={index} className="flex items-start">
                          <span className="h-2 w-2 mt-1.5 mr-3 shrink-0 rounded-full bg-red-500"></span>
                          <span className="text-muted-foreground">{flaw}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                 <Button onClick={() => onDownloadFinancialReportPdf(message.financialReport)} variant="secondary" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  {t('downloadPdf')}
                </Button>
              </CardContent>
            </Card>
            {message.financialReport.keyMetrics && message.financialReport.keyMetrics.length > 0 && (
              <FinancialReportChart 
                data={message.financialReport.keyMetrics}
                revenueLabel={t('revenue')}
                netIncomeLabel={t('netIncome')}
              />
            )}
          </>
        )}
      </div>
      {!isAssistant && (
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarFallback>
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-4 animate-in fade-in">
      <SashaAvatar className="w-8 h-8 shrink-0" />
      <div className="bg-primary text-primary-foreground rounded-lg p-3 shadow-sm flex items-center space-x-1">
        <span className="w-2 h-2 bg-primary-foreground/50 rounded-full animate-pulse delay-0 duration-1000"></span>
        <span className="w-2 h-2 bg-primary-foreground/50 rounded-full animate-pulse delay-200 duration-1000"></span>
        <span className="w-2 h-2 bg-primary-foreground/50 rounded-full animate-pulse delay-400 duration-1000"></span>
      </div>
    </div>
  );
}
