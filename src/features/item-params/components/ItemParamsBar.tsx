import { useEffect, useId } from 'react';
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from '@/shared/ui';
import { type ItemParam, useParamDict } from '../api/params-api';
import { fieldKind } from '../model/field-types';
import type { ItemParamsState } from '../model/use-item-params-state';

function DictField({ field, value, onChange }: { field: ItemParam; value: string; onChange: (v: string) => void }) {
  const id = useId();
  const dict = useParamDict(field);
  const first = dict.data?.[0]?.value;

  // Справочник без значения — выбираем первый вариант, как старый фронт.
  useEffect(() => {
    if (!value && first !== undefined) onChange(first);
  }, [value, first, onChange]);

  return (
    <div className="flex min-w-44 flex-col gap-1">
      <Label htmlFor={id}>{field.caption}</Label>
      {dict.isPending ? (
        <Skeleton className="h-9" />
      ) : (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={id} className="h-8 bg-canvas">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(dict.data ?? []).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

const INPUT_TYPE = { date: 'date', datetime: 'datetime-local', time: 'time', number: 'number' } as const;

function PlainField({ field, value, onChange }: { field: ItemParam; value: string; onChange: (v: string) => void }) {
  const id = useId();
  const kind = fieldKind(field.type);
  const type = kind in INPUT_TYPE ? INPUT_TYPE[kind as keyof typeof INPUT_TYPE] : 'text';
  return (
    <div className="flex min-w-36 flex-col gap-1">
      <Label htmlFor={id}>{field.caption}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        maxLength={field.maxLength ?? undefined}
        className="h-8 bg-canvas"
        onChange={(e) => {
          onChange(e.target.value);
        }}
      />
    </div>
  );
}

/** Панель входных параметров раздела (над дашбордом или таблицей). */
export function ItemParamsBar({ state }: { state: ItemParamsState }) {
  const { fields, values, setValue } = state;
  if (fields.isPending) return <Skeleton className="h-14 w-80" />;
  if (!fields.data?.length) return null;
  return (
    <div className="flex flex-wrap items-end gap-3">
      {fields.data.map((field) =>
        fieldKind(field.type) === 'dict' ? (
          <DictField
            key={field.name}
            field={field}
            value={values[field.name] ?? ''}
            onChange={(v) => {
              setValue(field.name, v);
            }}
          />
        ) : (
          <PlainField
            key={field.name}
            field={field}
            value={values[field.name] ?? ''}
            onChange={(v) => {
              setValue(field.name, v);
            }}
          />
        ),
      )}
    </div>
  );
}
