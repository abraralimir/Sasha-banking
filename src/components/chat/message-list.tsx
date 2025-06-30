'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SashaAvatar } from '@/components/sasha-avatar';
import { User, Download } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
};

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onDownloadPdf: (report: Message['analysisReport']) => void;
}

export function MessageList({ messages, isLoading, onDownloadPdf }: MessageListProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <ScrollArea className="h-full" viewportRef={viewportRef}>
      <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} onDownloadPdf={onDownloadPdf} />
        ))}
        {isLoading && <TypingIndicator />}
      </div>
    </ScrollArea>
  );
}

function ChatMessage({ message, onDownloadPdf }: { message: Message, onDownloadPdf: (report: Message['analysisReport']) => void; }) {
  const isAssistant = message.role === 'assistant';
  return (
    <div
      className={cn('flex items-start gap-4 animate-in fade-in', {
        'justify-end': !isAssistant,
      })}
    >
      {isAssistant && <SashaAvatar className="w-8 h-8 shrink-0" />}
      <div className="max-w-[75%] space-y-2">
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
          {message.imageUrl && (
              <div className="mt-2 relative aspect-square max-w-sm">
                  <Image src={message.imageUrl} alt="Generated image" fill className="rounded-lg object-cover" />
              </div>
          )}
        </div>

        {message.analysisReport && (
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-base">Loan Analysis Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold mb-1">Summary</h3>
                <p className="text-muted-foreground">{message.analysisReport.summary}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Prediction</h3>
                <p className="text-muted-foreground">{message.analysisReport.prediction}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Eligibility</h3>
                <p className="text-muted-foreground">{message.analysisReport.eligibility}</p>
              </div>
              <Button onClick={() => onDownloadPdf(message.analysisReport)} variant="secondary" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </CardContent>
          </Card>
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
