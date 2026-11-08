import type { ComponentProps } from 'react';
import { type Control, type FieldPath, type FieldValues, useController } from 'react-hook-form';
import { cn } from '@/shared/lib/cn';
import { formatPhone, phoneDigits } from '@/shared/lib/phone';
import { Checkbox } from '../checkbox';
import { Input, Textarea } from '../input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';
import { type FieldChromeProps, FormField } from './form-field';

interface BaseFieldProps<T extends FieldValues> extends Omit<FieldChromeProps, 'error'> {
  control: Control<T>;
  name: FieldPath<T>;
}

type InputPassthrough = Omit<ComponentProps<'input'>, 'name' | 'value' | 'defaultValue' | 'onChange' | 'type'>;

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  required,
  className,
  type = 'text',
  ...inputProps
}: BaseFieldProps<T> & InputPassthrough & { type?: 'text' | 'email' | 'password' | 'search' }) {
  const { field, fieldState } = useController({ control, name });
  return (
    <FormField label={label} hint={hint} error={fieldState.error?.message} required={required} className={className}>
      <Input type={type} {...inputProps} {...field} value={field.value ?? ''} />
    </FormField>
  );
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  required,
  className,
  ...props
}: BaseFieldProps<T> & Omit<ComponentProps<'textarea'>, 'name' | 'value' | 'onChange'>) {
  const { field, fieldState } = useController({ control, name });
  return (
    <FormField label={label} hint={hint} error={fieldState.error?.message} required={required} className={className}>
      <Textarea {...props} {...field} value={field.value ?? ''} />
    </FormField>
  );
}

/** Число. Пустое поле → undefined (а не 0), чтобы zod мог отличить «не заполнено». */
export function NumberField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  required,
  className,
  ...inputProps
}: BaseFieldProps<T> & InputPassthrough) {
  const {
    field: { value, onChange, ...field },
    fieldState,
  } = useController({ control, name });
  return (
    <FormField label={label} hint={hint} error={fieldState.error?.message} required={required} className={className}>
      <Input
        type="number"
        inputMode="decimal"
        {...inputProps}
        {...field}
        value={value ?? ''}
        onChange={(e) => {
          onChange(e.target.value === '' ? undefined : e.target.valueAsNumber);
        }}
      />
    </FormField>
  );
}

/** Телефон: хранит только цифры, показывает отформатированным. */
export function PhoneField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  required,
  className,
  ...inputProps
}: BaseFieldProps<T> & InputPassthrough) {
  const {
    field: { value, onChange, ...field },
    fieldState,
  } = useController({ control, name });
  return (
    <FormField label={label} hint={hint} error={fieldState.error?.message} required={required} className={className}>
      <Input
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+7 999 123-45-67"
        {...inputProps}
        {...field}
        value={formatPhone(value ?? '')}
        onChange={(e) => {
          onChange(phoneDigits(e.target.value).slice(0, 15));
        }}
      />
    </FormField>
  );
}

/** Дата в формате YYYY-MM-DD. Пока нативный input; Calendar-пикер добавим через shadcn по мере надобности. */
export function DateField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  required,
  className,
  ...inputProps
}: BaseFieldProps<T> & InputPassthrough) {
  const { field, fieldState } = useController({ control, name });
  return (
    <FormField label={label} hint={hint} error={fieldState.error?.message} required={required} className={className}>
      <Input type="date" {...inputProps} {...field} value={field.value ?? ''} />
    </FormField>
  );
}

export interface SelectFieldOption {
  value: string;
  label: string;
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  required,
  className,
  options,
  placeholder,
  disabled,
}: BaseFieldProps<T> & { options: readonly SelectFieldOption[]; placeholder?: string; disabled?: boolean }) {
  const { field, fieldState } = useController({ control, name });
  return (
    <FormField label={label} hint={hint} error={fieldState.error?.message} required={required} className={className}>
      <SelectFieldTrigger
        value={field.value ?? ''}
        onChange={field.onChange}
        onBlur={field.onBlur}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
      />
    </FormField>
  );
}

function SelectFieldTrigger({
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  disabled,
  ...aria
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  options: readonly SelectFieldOption[];
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  id?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled ?? false}>
      <SelectTrigger onBlur={onBlur} {...aria}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function CheckboxField<T extends FieldValues>({
  control,
  name,
  label,
  className,
}: BaseFieldProps<T> & { label: string }) {
  const {
    field: { value, onChange, ...field },
  } = useController({ control, name });
  return (
    <label className={cn('flex cursor-pointer items-center gap-2 text-body', className)}>
      <Checkbox
        {...field}
        checked={Boolean(value)}
        onCheckedChange={(checked) => {
          onChange(checked === true);
        }}
      />
      {label}
    </label>
  );
}
