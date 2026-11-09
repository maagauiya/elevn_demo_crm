import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/features/auth';
import { isApiError } from '@/shared/api';
import { Button, DialogContent, Input, Label, toast } from '@/shared/ui';
import { useSetExtension } from '../api/telephony-api';
import { NS } from '../i18n';

/** Внутренний номер сотрудника для АТС (WAATSSetIntNumber). Вступает в силу после повторного входа. */
export function ExtensionDialog({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation(NS);
  const user = useCurrentUser();
  const save = useSetExtension();
  const [value, setValue] = useState(user.ats.extension ?? '');
  return (
    <DialogContent
      title={t('extension.title')}
      footer={
        <Button
          variant="primary"
          disabled={!value.trim() || save.isPending}
          onClick={async () => {
            try {
              toast.success((await save.mutateAsync(value.trim())) || t('extension.saved'));
              onDone();
            } catch (error) {
              toast.error(isApiError(error) ? error.message : t('extension.title'));
            }
          }}
        >
          {t('extension.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ats-ext">{t('extension.label')}</Label>
        <Input
          id="ats-ext"
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.replace(/\D/g, ''));
          }}
        />
      </div>
    </DialogContent>
  );
}
