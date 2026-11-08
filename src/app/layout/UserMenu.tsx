import { Check, Languages, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser, useLogout } from '@/features/auth';
import { LANGUAGES } from '@/shared/i18n';
import {
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

  return (
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
        <DropdownMenuItem destructive onSelect={logout}>
          <LogOut />
          {t('actions.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
