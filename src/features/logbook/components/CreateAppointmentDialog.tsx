import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Search } from 'lucide-react';
import { useState } from 'react';
import { useController, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { isApiError } from '@/shared/api';
import { cn } from '@/shared/lib/cn';
import { formatPhone } from '@/shared/lib/phone';
import {
  Button,
  DateField,
  DialogContent,
  FormField,
  Input,
  Label,
  SelectField,
  Skeleton,
  TextareaField,
  TextField,
  toast,
} from '@/shared/ui';
import { useClientSearch, useCreateAppointment, useDoctorServices } from '../api/logbook-api';
import type { Client } from '../api/schemas';
import { NS } from '../i18n';
import type { DoctorOption } from './AppointmentDialogs';

const schema = z.object({
  clientId: z.number({ message: 'create.chooseClient' }),
  doctorId: z.string().min(1, 'create.chooseDoctor'),
  date: z.string().min(1, 'errors.required'),
  time: z.string().min(1, 'errors.required'),
  services: z.array(z.object({ id: z.number(), price: z.number() })),
  comment: z.string(),
});

type FormValues = z.infer<typeof schema>;

export interface CreatePreset {
  doctorId: number | null;
  cabinetId: number | null;
  date: string;
  time: string;
  /** Клиент, известный заранее (например, из карточки входящего звонка) */
  client?: Client;
}

function ClientPicker({
  value,
  onChange,
  error,
}: {
  value: Client | null;
  onChange: (c: Client) => void;
  error?: string;
}) {
  const { t } = useTranslation(NS);
  const [search, setSearch] = useState('');
  const result = useClientSearch(search);
  const short = search.trim().length < 2;
  return (
    <FormField label={t('create.client')} required error={error ? t(error as 'create.chooseClient') : undefined}>
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
          <Input
            type="search"
            value={search}
            placeholder={t('create.clientSearch')}
            className="pl-9"
            onChange={(e) => {
              setSearch(e.target.value);
            }}
          />
        </div>
        {value ? (
          <p className="rounded-sm bg-accent-tint px-3 py-2 text-body text-accent">
            {value.name}
            {value.phone ? ` · ${formatPhone(value.phone)}` : ''}
          </p>
        ) : null}
        {short ? (
          <p className="text-micro text-ink-muted">{t('create.clientMin')}</p>
        ) : result.isPending ? (
          <Skeleton className="h-24" />
        ) : result.data?.length ? (
          <ul className="max-h-44 overflow-y-auto rounded-sm border border-hairline" aria-label={t('create.client')}>
            {result.data.slice(0, 50).map((client) => (
              <li key={client.id}>
                <button
                  type="button"
                  aria-pressed={value?.id === client.id}
                  onClick={() => {
                    onChange(client);
                  }}
                  className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-body hover:bg-canvas-sunken aria-pressed:bg-accent-tint"
                >
                  <span className="truncate">{client.name}</span>
                  <span className="shrink-0 text-caption text-ink-muted">{formatPhone(client.phone)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-micro text-ink-muted">{t('create.clientNotFound')}</p>
        )}
      </div>
    </FormField>
  );
}

function ServicesPicker({
  doctorId,
  value,
  onChange,
}: {
  doctorId: number | null;
  value: FormValues['services'];
  onChange: (v: FormValues['services']) => void;
}) {
  const { t } = useTranslation(NS);
  const services = useDoctorServices(doctorId);
  const [search, setSearch] = useState('');
  if (doctorId === null) return null;
  const q = search.trim().toLowerCase();
  const list = (services.data ?? []).filter((s) => !q || s.name.toLowerCase().includes(q));
  const selected = new Set(value.map((s) => s.id));
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{t('create.services')}</Label>
      <Input
        type="search"
        value={search}
        placeholder={t('create.servicesSearch')}
        onChange={(e) => {
          setSearch(e.target.value);
        }}
      />
      {services.isPending ? (
        <Skeleton className="h-24" />
      ) : list.length ? (
        <ul className="max-h-44 overflow-y-auto rounded-sm border border-hairline">
          {list.slice(0, 100).map((service) => {
            const on = selected.has(service.id);
            return (
              <li key={service.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    onChange(
                      on
                        ? value.filter((s) => s.id !== service.id)
                        : [...value, { id: service.id, price: service.price }],
                    );
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-body hover:bg-canvas-sunken"
                >
                  <Check className={cn('size-4 shrink-0 text-accent', !on && 'invisible')} />
                  <span className="flex-1 truncate">{service.name}</span>
                  <span className="shrink-0 text-caption text-ink-muted">{service.price.toLocaleString('ru-RU')}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-micro text-ink-muted">{t('create.servicesNone')}</p>
      )}
    </div>
  );
}

/** Диалог новой записи: клиент, специалист, дата, время, услуги, комментарий → WASCreateApp. */
export function CreateAppointmentDialog({
  preset,
  doctors,
  onDone,
}: {
  preset: CreatePreset;
  doctors: DoctorOption[];
  onDone: () => void;
}) {
  const { t } = useTranslation(NS);
  const create = useCreateAppointment();
  const [client, setClient] = useState<Client | null>(preset.client ?? null);
  const { control, handleSubmit, setValue, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...(preset.client ? { clientId: preset.client.id } : {}),
      doctorId: preset.doctorId !== null ? String(preset.doctorId) : '',
      date: preset.date,
      time: preset.time,
      services: [],
      comment: '',
    },
  });
  const servicesField = useController({ control, name: 'services' });
  const doctorId = useWatch({ control, name: 'doctorId' });

  return (
    <DialogContent
      title={t('create.title')}
      className="max-w-xl"
      footer={
        <Button type="submit" form="create-appointment" variant="primary" disabled={create.isPending}>
          {t('create.submit')}
        </Button>
      }
    >
      <form
        id="create-appointment"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(async (values) => {
          try {
            await create.mutateAsync({
              ...values,
              doctorId: Number(values.doctorId),
              ...(preset.cabinetId !== null ? { cabinetId: preset.cabinetId } : {}),
            });
            toast.success(t('create.success'));
            onDone();
          } catch (error) {
            toast.error(isApiError(error) ? error.message : t('create.title'));
          }
        })}
      >
        <ClientPicker
          value={client}
          error={formState.errors.clientId?.message}
          onChange={(c) => {
            setClient(c);
            setValue('clientId', c.id, { shouldValidate: true });
          }}
        />
        <SelectField
          control={control}
          name="doctorId"
          label={t('create.doctor')}
          required
          options={doctors.map((d) => ({ value: String(d.id), label: d.label }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <DateField control={control} name="date" label={t('create.date')} required />
          <TextField control={control} name="time" type="time" step={900} label={t('create.time')} required />
        </div>
        <ServicesPicker
          doctorId={doctorId ? Number(doctorId) : null}
          value={servicesField.field.value}
          onChange={servicesField.field.onChange}
        />
        <TextareaField control={control} name="comment" label={t('create.comment')} />
      </form>
    </DialogContent>
  );
}
