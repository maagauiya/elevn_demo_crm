import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { isApiError } from '@/shared/api';
import { Button, DateField, DialogContent, SelectField, TextareaField, TextField, toast } from '@/shared/ui';
import { useCopyAppointment, useDeleteAppointment, useUpdateAppointment } from '../api/logbook-api';
import type { Appointment } from '../api/schemas';
import { NS } from '../i18n';
import { formatMinutes, toMinutes } from '../model/time';

export interface DoctorOption {
  id: number;
  label: string;
}

const errorText = (error: unknown, fallback: string) => (isApiError(error) ? error.message : fallback);

const editSchema = z
  .object({
    date: z.string().min(1, 'errors.required'),
    start: z.string().min(1, 'errors.required'),
    end: z.string().min(1, 'errors.required'),
    doctorId: z.string().min(1, 'errors.required'),
    comment: z.string(),
  })
  .refine((v) => toMinutes(v.end) > toMinutes(v.start), { path: ['end'], message: 'edit.endBeforeStart' });

/** Изменение записи: дата, время начала/окончания, специалист, комментарий → WASUpdateApp. */
export function EditAppointmentDialog({
  appointment,
  date,
  doctors,
  onDone,
}: {
  appointment: Appointment;
  date: string;
  doctors: DoctorOption[];
  onDone: () => void;
}) {
  const { t } = useTranslation(NS);
  const update = useUpdateAppointment();
  const { control, handleSubmit } = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      date,
      start: formatMinutes(appointment.start),
      end: formatMinutes(appointment.end),
      doctorId: String(appointment.doctorId),
      comment: appointment.comment,
    },
  });
  const options = doctors.some((d) => d.id === appointment.doctorId)
    ? doctors
    : [{ id: appointment.doctorId, label: String(appointment.doctorId) }, ...doctors];
  return (
    <DialogContent
      title={t('edit.title')}
      description={appointment.clientName}
      footer={
        <Button type="submit" form="edit-appointment" variant="primary" disabled={update.isPending}>
          {t('edit.save')}
        </Button>
      }
    >
      <form
        id="edit-appointment"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(async (values) => {
          try {
            const message = await update.mutateAsync({
              appointment,
              date: values.date,
              start: toMinutes(values.start),
              end: toMinutes(values.end),
              doctorId: Number(values.doctorId),
              ...(values.comment !== appointment.comment ? { comment: values.comment } : {}),
            });
            toast.success(message || t('actions.updated'));
            onDone();
          } catch (error) {
            toast.error(errorText(error, t('edit.title')));
          }
        })}
      >
        <DateField control={control} name="date" label={t('edit.date')} required />
        <div className="grid grid-cols-2 gap-3">
          <TextField control={control} name="start" type="time" step={900} label={t('edit.start')} required />
          <TextField control={control} name="end" type="time" step={900} label={t('edit.end')} required />
        </div>
        {options.length > 1 ? (
          <SelectField
            control={control}
            name="doctorId"
            label={t('edit.doctor')}
            required
            options={options.map((d) => ({ value: String(d.id), label: d.label }))}
          />
        ) : null}
        <TextareaField control={control} name="comment" label={t('edit.comment')} />
      </form>
    </DialogContent>
  );
}

const copySchema = z.object({
  date: z.string().min(1, 'errors.required'),
  time: z.string().min(1, 'errors.required'),
  doctorId: z.string().min(1, 'errors.required'),
});

/** Копирование записи на другое время/специалиста → WASCopyApp. */
export function CopyAppointmentDialog({
  appointment,
  date,
  doctors,
  onDone,
}: {
  appointment: Appointment;
  date: string;
  doctors: DoctorOption[];
  onDone: () => void;
}) {
  const { t } = useTranslation(NS);
  const copy = useCopyAppointment();
  const { control, handleSubmit } = useForm<z.infer<typeof copySchema>>({
    resolver: zodResolver(copySchema),
    defaultValues: { date, time: formatMinutes(appointment.end), doctorId: String(appointment.doctorId) },
  });
  return (
    <DialogContent
      title={t('copy.title')}
      description={appointment.clientName}
      footer={
        <Button type="submit" form="copy-appointment" variant="primary" disabled={copy.isPending}>
          {t('copy.submit')}
        </Button>
      }
    >
      <form
        id="copy-appointment"
        noValidate
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(async (values) => {
          try {
            await copy.mutateAsync({
              id: appointment.id,
              date: values.date,
              time: values.time,
              doctorId: Number(values.doctorId),
              cabinetId: appointment.cabinetId,
            });
            toast.success(t('actions.copied'));
            onDone();
          } catch (error) {
            toast.error(errorText(error, t('copy.title')));
          }
        })}
      >
        <div className="grid grid-cols-2 gap-3">
          <DateField control={control} name="date" label={t('edit.date')} required />
          <TextField control={control} name="time" type="time" step={900} label={t('edit.start')} required />
        </div>
        {doctors.length > 1 ? (
          <SelectField
            control={control}
            name="doctorId"
            label={t('edit.doctor')}
            required
            options={doctors.map((d) => ({ value: String(d.id), label: d.label }))}
          />
        ) : null}
      </form>
    </DialogContent>
  );
}

/** Удаление записи с причиной → WASDeleteApp. */
export function DeleteAppointmentDialog({ appointment, onDone }: { appointment: Appointment; onDone: () => void }) {
  const { t } = useTranslation(NS);
  const remove = useDeleteAppointment();
  const { control, handleSubmit } = useForm<{ reason: string }>({ defaultValues: { reason: '' } });
  return (
    <DialogContent
      title={t('remove.title')}
      description={t('remove.description', {
        client: appointment.clientName || t('blocked'),
        time: `${formatMinutes(appointment.start)}–${formatMinutes(appointment.end)}`,
      })}
      footer={
        <Button type="submit" form="delete-appointment" variant="danger" disabled={remove.isPending}>
          {t('remove.submit')}
        </Button>
      }
    >
      <form
        id="delete-appointment"
        noValidate
        onSubmit={handleSubmit(async (values) => {
          try {
            const message = await remove.mutateAsync({ id: appointment.id, reason: values.reason });
            toast.success(message || t('actions.deleted'));
            onDone();
          } catch (error) {
            toast.error(errorText(error, t('remove.title')));
          }
        })}
      >
        <TextareaField control={control} name="reason" label={t('remove.reason')} />
      </form>
    </DialogContent>
  );
}
