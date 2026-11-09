import { Menu } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';
import { SidebarNav } from '@/features/navigation';
import { FloatingNotifier, NotificationBell } from '@/features/notifications';
import { TelephonyCenter } from '@/features/telephony';
import { IconButton, Sheet, SheetContent } from '@/shared/ui';
import { UserMenu } from './UserMenu';

function Logo() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
      <div className="flex size-9 items-center justify-center rounded-md bg-accent text-label text-on-accent">E</div>
      <span className="flex-1 text-title">{t('appName')}</span>
      <NotificationBell />
    </div>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <Logo />
      <div className="flex-1 overflow-y-auto">
        <SidebarNav {...(onNavigate ? { onNavigate } : {})} />
      </div>
      <div className="border-t border-hairline p-2">
        <UserMenu />
      </div>
    </div>
  );
}

/** Оболочка: сайдбар с серверным меню + область контента. На узких экранах меню уезжает в шторку. */
export function AppShell() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-full">
      <FloatingNotifier />
      <TelephonyCenter />
      <aside className="sticky top-0 hidden h-dvh w-62 shrink-0 border-r border-hairline bg-canvas lg:block">
        <SidebarBody />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" title={t('appName')} hideHeader className="max-w-72">
          <SidebarBody
            onNavigate={() => {
              setMobileOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-hairline bg-canvas px-4 py-2 lg:hidden">
          <IconButton
            label={t('actions.openMenu')}
            onClick={() => {
              setMobileOpen(true);
            }}
          >
            <Menu />
          </IconButton>
          <span className="text-label">{t('appName')}</span>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
