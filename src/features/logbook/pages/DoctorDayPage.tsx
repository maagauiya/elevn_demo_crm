import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '@/shared/ui';
import { NS } from '../i18n';

export function DoctorDayPage() {
  const { t } = useTranslation(NS);
  return <PlaceholderPage title={t('title.doctorDay')} track="A" source="components/logbook/oneDoc" />;
}
