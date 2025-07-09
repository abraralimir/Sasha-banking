import type {Metadata} from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from '@/context/language-context';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarInset 
} from '@/components/ui/sidebar';
import { SashaAvatar } from '@/components/sasha-avatar';
import { MainNav } from '@/components/main-nav';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

const APP_NAME = 'Sasha Banking';
const APP_DESCRIPTION = 'Your intelligent banking assistant and financial strategist.';
const APP_URL = new URL('https://sasha-banking-app.vercel.app'); // Replace with your actual production URL

export const metadata: Metadata = {
  metadataBase: APP_URL,
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: 'default',
  },
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: APP_URL,
    siteName: APP_NAME,
    images: [
      {
        url: '/sasha-og.png',
        width: 1200,
        height: 630,
        alt: 'Sasha AI Banking Assistant',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: ['/sasha-og.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={cn(
        "font-body antialiased",
        inter.variable,
        cairo.variable
      )}>
        <LanguageProvider>
          <SidebarProvider defaultOpen={false}>
            <Sidebar>
              <SidebarHeader>
                <div className="flex items-center gap-2">
                  <SashaAvatar className="w-8 h-8" />
                  <span className="text-lg font-semibold">Sasha</span>
                </div>
              </SidebarHeader>
              <SidebarContent>
                <MainNav />
              </SidebarContent>
            </Sidebar>
            <SidebarInset>
              {children}
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </LanguageProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
