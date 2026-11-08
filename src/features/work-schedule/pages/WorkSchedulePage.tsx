import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '@/shared/ui';
import { NS } from '../i18n';

export function WorkSchedulePage() {
  const { t } = useTranslation(NS);
  return <PlaceholderPage title={t('title.workSchedule')} track="A" source="components/workSchedule" />;
}
