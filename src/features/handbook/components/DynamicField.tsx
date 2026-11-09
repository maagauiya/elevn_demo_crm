import type { Control } from 'react-hook-form';
import { CheckboxField, DateField, NumberField, PhoneField, SelectField, TextareaField, TextField } from '@/shared/ui';
import { useItemParamDict } from '../api/table-meta';

/**
 * Унифицированное описание поля: общее между параметрами раздела (WAGetItemParams) и полями
 * редактора записи (WAGetItemEditor) — у них разная форма ответа, но одна FIELDTYPEID-нумерация
 * (см. model/column-types.ts) и общий рендер инпутов. Значения формы — всегда Record<string, string>,
 * поэтому Control не параметризуем конкретным DTO: имя поля определяется данными с бэкенда, не схемой формы.
 */
export interface DynamicFieldDescriptor {
  name: string;
  caption: string;
  typeId: string;
  /** Справочник параметра (WAGetItemParams). У полей редактора (WAGetItemEditor) его нет — там связь через FK, см. ниже. */
  dictName: string | null;
  dictType: string | null;
  wUserId: string | null;
  maxLength?: number | null;
  isBool?: boolean;
  isPassword?: boolean;
  isPhone?: boolean;
  readOnly?: boolean;
}

type FormValues = Record<string, string>;

/** Справочник для поля типа 10 — свой компонент, т.к. у каждого поля свой запрос WAGetItemParamDict. */
function DictSelectField({ field, control }: { field: DynamicFieldDescriptor; control: Control<FormValues> }) {
  const dict = useItemParamDict(field, true);
  const options = (dict.data ?? []).map((item) => ({ value: item.id, label: item.value }));
  return (
    <SelectField
      control={control}
      name={field.name}
      label={field.caption}
      options={options}
      disabled={dict.isPending}
    />
  );
}

export function DynamicField({ field, control }: { field: DynamicFieldDescriptor; control: Control<FormValues> }) {
  if (field.isBool) return <CheckboxField control={control} name={field.name} label={field.caption} />;
  if (field.isPassword)
    return (
      <TextField control={control} name={field.name} label={field.caption} type="password" disabled={field.readOnly} />
    );
  if (field.isPhone || field.name === 'CELLPHONE')
    return <PhoneField control={control} name={field.name} label={field.caption} disabled={field.readOnly} />;

  switch (field.typeId) {
    case '1':
    case '3':
      return <NumberField control={control} name={field.name} label={field.caption} disabled={field.readOnly} />;
    case '5':
    case '40':
      return (
        <TextareaField control={control} name={field.name} label={field.caption} rows={2} disabled={field.readOnly} />
      );
    case '6':
    case '7':
      return <DateField control={control} name={field.name} label={field.caption} disabled={field.readOnly} />;
    case '10':
      // У редактора (WAGetItemEditor) справочника нет — связь через FKTable/FKField, пикер пока не делали.
      if (!field.dictName) return <TextField control={control} name={field.name} label={field.caption} disabled />;
      return <DictSelectField field={field} control={control} />;
    default:
      return (
        <TextField
          control={control}
          name={field.name}
          label={field.caption}
          maxLength={field.maxLength ?? undefined}
          disabled={field.readOnly}
        />
      );
  }
}
