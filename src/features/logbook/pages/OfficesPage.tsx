import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '@/shared/ui';
import { NS } from '../i18n';

export function OfficesPage() {
  const { t } = useTranslation(NS);
  return <PlaceholderPage title={t('title.offices')} track="A" source="components/logbook (cabinets: true)" />;
}
