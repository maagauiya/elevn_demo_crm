import { Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatPhone } from '@/shared/lib/phone';
import { Button } from '@/shared/ui';
import { NS } from '../i18n';
import { useTelephony } from '../model/store';

/** Номер телефона: при подключённой АТС — звонок через неё, иначе обычная ссылка tel:. */
export function CallButton({ phone }: { phone: string }) {
  const { t } = useTranslation(NS);
  const { status, client } = useTelephony();
  const digits = phone.replace(/\D/g, '');
  return (
    <span className="flex flex-wrap items-center gap-2">
      <a className="text-accent hover:underline" href={`tel:+${digits.length === 10 ? `7${digits}` : digits}`}>
        {formatPhone(phone)}
      </a>
      {status === 'connected' && client ? (
        <Button
          size="sm"
          onClick={() => {
            client.call(digits);
          }}
        >
          <Phone />
          {t('call')}
        </Button>
      ) : null}
    </span>
  );
}
