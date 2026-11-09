import { Check, Languages, LogOut, MessageCircle, PhoneCall } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser, useLogout } from '@/features/auth';
import { InstancesDialog } from '@/features/messaging';
import { ExtensionDialog, TelephonyStatus } from '@/features/telephony';
import { LANGUAGES } from '@/shared/i18n';
import {
  Dialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui';

const LANGUAGE_NAMES: Record<(typeof LANGUAGES)[number], string> = { ru: 'Русский', en: 'English' };

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function UserMenu() {
  const { t, i18n } = useTranslation();
  const user = useCurrentUser();
  const logout = useLogout();
  const [dialog, setDialog] = useState<'extension' | 'whatsapp' | null>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-left transition-colors hover:bg-canvas-sunken">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-pill bg-accent text-caption text-on-accent">
            {initials(user.name)}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-label">{user.name}</span>
            <span className="truncate text-subtitle text-ink-muted">{user.position}</span>
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Languages className="size-3.5" />
            {t('language')}
          </DropdownMenuLabel>
          {LANGUAGES.map((lng) => (
            <DropdownMenuItem key={lng} onSelect={() => void i18n.changeLanguage(lng)}>
              <span className="flex-1">{LANGUAGE_NAMES[lng]}</span>
              {i18n.language === lng ? <Check className="text-accent!" /> : null}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <TelephonyStatus />
          <DropdownMenuItem
            onSelect={() => {
              setDialog('extension');
            }}
          >
            <PhoneCall />
            {t('menu.extension')}
            {user.ats.extension ? (
              <span className="ml-auto text-micro text-ink-muted">{user.ats.extension}</span>
            ) : null}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setDialog('whatsapp');
            }}
          >
            <MessageCircle />
            {t('menu.whatsapp')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={logout}>
            <LogOut />
            {t('actions.logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        {dialog === 'extension' ? (
          <ExtensionDialog
            onDone={() => {
              setDialog(null);
            }}
          />
        ) : null}
        {dialog === 'whatsapp' ? <InstancesDialog /> : null}
      </Dialog>
    </>
  );
}
