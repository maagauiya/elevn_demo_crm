import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '@/shared/ui';
import { NS } from '../i18n';

export function LicenseLegalPage() {
  const { t } = useTranslation(NS);
  return <PlaceholderPage title={t('title.licenseLegal')} track="B" source="components/payment/licenseLegal" />;
}
