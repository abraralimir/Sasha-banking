'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, Sheet as SheetIcon, BookOpen } from 'lucide-react';
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
        <SidebarMenuButton asChild isActive={pathname.startsWith('/learn')}>
          <Link href="/learn">
            <BookOpen />
            <span>{t('learnTitle')}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
