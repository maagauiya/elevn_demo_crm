import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '@/shared/ui';
import { NS } from '../i18n';

export function TrainingPage() {
  const { t } = useTranslation(NS);
  return <PlaceholderPage title={t('title.training')} track="A" source="components/logbook (isTraining: true)" />;
}
