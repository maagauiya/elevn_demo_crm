import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '@/shared/ui';
import { NS } from '../i18n';

export function LogbookPage() {
  const { t } = useTranslation(NS);
  return <PlaceholderPage title={t('title.logbook')} track="A" source="components/logbook, redux/logbook" />;
}
