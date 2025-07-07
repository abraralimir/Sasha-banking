'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, Sheet as SheetIcon, BookOpen, BarChart3, GraduationCap } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { useLanguage } from '@/context/language-context';

export function MainNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname.startsWith('/chat')}>
          <Link href="/chat">
            <MessageCircle />
            <span>{t('chatTitle')}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname.startsWith('/spreadsheet')}>
          <Link href="/spreadsheet">
            <SheetIcon />
            <span>{t('spreadsheetTitle')}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname.startsWith('/spreadsheet-guide')}>
          <Link href="/spreadsheet-guide">
            <GraduationCap />
            <span>{t('spreadsheetGuideTitle')}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
       <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname.startsWith('/data-analytics')}>
          <Link href="/data-analytics">
            <BarChart3 />
            <span>{t('dataAnalyticsTitle')}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
       <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname.startsWith('/about')}>
          <Link href="/about">
            <BookOpen />
            <span>{t('aboutTitle')}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
