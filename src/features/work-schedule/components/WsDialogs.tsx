import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/shared/api';
import {
  Button,
  DialogContent,
  IconButton,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  toast,
} from '@/shared/ui';
import { useApplyTemplate, useCopyPeriod, usePeriods, useSaveTemplate, useTemplates } from '../api/ws-api';
import { NS } from '../i18n';
import type { CellRef } from '../model/selection';

const fail = (error: unknown, fallback: string) => {
  toast.error(isApiError(error) ? error.message : fallback);
};

/** Часы работы для статуса с WDETEDIT = 1 («Неполный день»). Можно несколько интервалов. */
export function TimeRangesDialog({
  statusName,
  onApply,
}: {
  statusName: string;
  onApply: (ranges: { from: string; to: string }[]) => void;
}) {
  const { t } = useTranslation(NS);
  const [ranges, setRanges] = useState([{ from: '10:00', to: '14:00' }]);
  const invalid = ranges.some((r) => !r.from || !r.to || r.to <= r.from);
  return (
    <DialogContent
      title={t('time.title')}
      description={statusName}
      footer={
        <Button
          variant="primary"
          disabled={invalid}
          onClick={() => {
            onApply(ranges);
          }}
        >
          {t('time.apply')}
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        {ranges.map((range, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <Label htmlFor={`from-${i}`}>{t('time.from')}</Label>
              <Input
                id={`from-${i}`}
                type="time"
                step={900}
                value={range.from}
                onChange={(e) => {
                  setRanges(ranges.map((r, j) => (j === i ? { ...r, from: e.target.value } : r)));
                }}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <Label htmlFor={`to-${i}`}>{t('time.to')}</Label>
              <Input
                id={`to-${i}`}
                type="time"
                step={900}
                value={range.to}
                aria-invalid={range.to <= range.from}
                onChange={(e) => {
                  setRanges(ranges.map((r, j) => (j === i ? { ...r, to: e.target.value } : r)));
                }}
              />
            </div>
            {ranges.length > 1 ? (
              <IconButton
                label={t('time.remove')}
                onClick={() => {
                  setRanges(ranges.filter((_, j) => j !== i));
                }}
              >
                <X />
              </IconButton>
            ) : null}
          </div>
        ))}
        {invalid ? <p className="text-micro text-danger">{t('time.invalid')}</p> : null}
        <Button
          size="sm"
          variant="ghost"
          className="self-start"
          onClick={() => {
            const last = ranges.at(-1);
            setRanges([...ranges, { from: last?.to ?? '15:00', to: '19:00' }]);
          }}
        >
          <Plus />
          {t('time.add')}
        </Button>
      </div>
    </DialogContent>
  );
}

/** Применение шаблона к специалистам за период → WATTSetByTimeTableTemplate. */
export function ApplyTemplateDialog({
  selectedDoctorIds,
  visibleDoctorIds,
  from,
  to,
  onDone,
}: {
  selectedDoctorIds: number[];
  visibleDoctorIds: number[];
  from: string;
  to: string;
  onDone: () => void;
}) {
  const { t } = useTranslation(NS);
  const templates = useTemplates();
  const apply = useApplyTemplate();
  const [templateId, setTemplateId] = useState('');
  const [who, setWho] = useState<'selected' | 'all'>(selectedDoctorIds.length ? 'selected' : 'all');
  const [period, setPeriod] = useState({ from, to });
  const doctorIds = who === 'selected' ? selectedDoctorIds : visibleDoctorIds;
  return (
    <DialogContent
      title={t('template.applyTitle')}
      footer={
        <Button
          variant="primary"
          disabled={!templateId || !doctorIds.length || apply.isPending}
          onClick={async () => {
            try {
              const message = await apply.mutateAsync({ templateId: Number(templateId), doctorIds, ...period });
              toast.success(message || t('done'));
              onDone();
            } catch (error) {
              fail(error, t('template.applyTitle'));
            }
          }}
        >
          {t('template.apply')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="template">{t('template.template')}</Label>
          {templates.isPending ? (
            <Skeleton className="h-9" />
          ) : (
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="template">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(templates.data ?? []).map((tpl) => (
                  <SelectItem key={tpl.id} value={String(tpl.id)}>
                    {tpl.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="pb-1 text-caption text-ink-muted">{t('template.doctors')}</legend>
          {(['selected', 'all'] as const).map((option) => (
            <label key={option} className="flex cursor-pointer items-center gap-2 text-body">
              <input
                type="radio"
                name="who"
                checked={who === option}
                disabled={option === 'selected' && !selectedDoctorIds.length}
                onChange={() => {
                  setWho(option);
                }}
                className="accent-(--color-accent)"
              />
              {option === 'selected'
                ? t('template.selectedRows', { count: selectedDoctorIds.length })
                : t('template.allRows', { count: visibleDoctorIds.length })}
            </label>
          ))}
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tpl-from">{t('template.from')}</Label>
            <Input
              id="tpl-from"
              type="date"
              value={period.from}
              onChange={(e) => {
                setPeriod({ ...period, from: e.target.value });
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tpl-to">{t('template.to')}</Label>
            <Input
              id="tpl-to"
              type="date"
              value={period.to}
              onChange={(e) => {
                setPeriod({ ...period, to: e.target.value });
              }}
            />
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

/** Сохранение выделенной последовательности дней как шаблона → WATTAddTimeTableTemplate. */
export function SaveTemplateDialog({ cells, onDone }: { cells: CellRef[]; onDone: () => void }) {
  const { t } = useTranslation(NS);
  const save = useSaveTemplate();
  const [name, setName] = useState('');
  return (
    <DialogContent
      title={t('template.saveTitle')}
      description={t('template.saveHint')}
      footer={
        <Button
          variant="primary"
          disabled={!name.trim() || save.isPending}
          onClick={async () => {
            try {
              const message = await save.mutateAsync({ name: name.trim(), cells });
              toast.success(message || t('done'));
              onDone();
            } catch (error) {
              fail(error, t('template.saveTitle'));
            }
          }}
        >
          {t('template.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tpl-name">{t('template.name')}</Label>
        <Input
          id="tpl-name"
          value={name}
          maxLength={127}
          onChange={(e) => {
            setName(e.target.value);
          }}
        />
      </div>
    </DialogContent>
  );
}

/** Копирование графика между периодами → WATTCopyPeriod. Варианты периодов — из WATTGetPeriodList. */
export function CopyPeriodDialog({ doctorIds, onDone }: { doctorIds: number[]; onDone: () => void }) {
  const { t } = useTranslation(NS);
  const fromList = usePeriods(0);
  const toList = usePeriods(1);
  const copy = useCopyPeriod();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const loading = fromList.isPending || toList.isPending;
  const empty = !loading && !fromList.data?.length;
  const select = (
    id: string,
    value: string,
    onChange: (v: string) => void,
    options: { id: number; name: string }[],
  ) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.id} value={String(o.id)}>
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  return (
    <DialogContent
      title={t('copy.title')}
      description={t('template.allRows', { count: doctorIds.length })}
      footer={
        <Button
          variant="primary"
          disabled={!from || !to || copy.isPending}
          onClick={async () => {
            try {
              const message = await copy.mutateAsync({ doctorIds, from: Number(from), to: Number(to) });
              toast.success(message || t('done'));
              onDone();
            } catch (error) {
              fail(error, t('copy.title'));
            }
          }}
        >
          {t('copy.submit')}
        </Button>
      }
    >
      {loading ? (
        <Skeleton className="h-24" />
      ) : empty ? (
        <p className="text-body text-ink-muted">{t('copy.none')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="copy-from">{t('copy.from')}</Label>
            {select('copy-from', from, setFrom, fromList.data ?? [])}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="copy-to">{t('copy.to')}</Label>
            {select('copy-to', to, setTo, toList.data ?? [])}
          </div>
        </div>
      )}
    </DialogContent>
  );
}
