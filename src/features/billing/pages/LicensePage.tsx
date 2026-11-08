import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '@/shared/ui';
import { NS } from '../i18n';

export function LicensePage() {
  const { t } = useTranslation(NS);
  return <PlaceholderPage title={t('title.license')} track="B" source="components/payment/license" />;
}
