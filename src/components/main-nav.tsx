'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, Sheet as SheetIcon } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

export function MainNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname.startsWith('/chat')}>
          <Link href="/chat">
            <MessageCircle />
            <span>Chat</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname.startsWith('/spreadsheet')}>
          <Link href="/spreadsheet">
            <SheetIcon />
            <span>Spreadsheet</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
