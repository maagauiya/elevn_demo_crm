import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '@/shared/ui';
import { NS } from '../i18n';

export function LicenseBuyPage() {
  const { t } = useTranslation(NS);
  return <PlaceholderPage title={t('title.licenseBuy')} track="B" source="components/payment/licenseBuy" />;
}
