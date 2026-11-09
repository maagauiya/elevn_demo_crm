import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';
import { NS } from '../i18n';
import type { ParamField } from '../api/table-meta';
import { DynamicField } from './DynamicField';

type Values = Record<string, string>;

/**
 * Форма входных параметров раздела (WAGetItemParams). Показывается только когда у раздела есть
 * параметры; при их отсутствии useItemParams возвращает [] и раздел открывается без формы.
 * Автоприменяет значения по умолчанию при первом показе — обновить можно кнопкой «Применить».
 */
export function ParamsForm({ fields, onApply }: { fields: ParamField[]; onApply: (values: Values) => void }) {
  const { t } = useTranslation(NS);
  const defaultValues = Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? '']));
  const { control, handleSubmit, reset } = useForm<Values>({ defaultValues });

  useEffect(() => {
    reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- применяем дефолты один раз при смене набора полей
  }, [fields]);

  useEffect(() => {
    onApply(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- автоприменение только при первом показе формы
  }, []);

  if (fields.length === 0) return null;

  return (
    <form
      onSubmit={handleSubmit(onApply)}
      className="mb-3 flex flex-wrap items-end gap-3 rounded-md border border-hairline bg-canvas p-3"
    >
      {fields.map((field) => (
        <div key={field.name} className="min-w-40">
          <DynamicField field={field} control={control} />
        </div>
      ))}
      <Button type="submit">{t('params.apply')}</Button>
    </form>
  );
}
