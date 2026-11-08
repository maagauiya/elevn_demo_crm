import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '@/shared/ui';
import { NS } from '../i18n';

export function LicensePhysicalPage() {
  const { t } = useTranslation(NS);
  return <PlaceholderPage title={t('title.licensePhysical')} track="B" source="components/payment/licensePhys" />;
}
