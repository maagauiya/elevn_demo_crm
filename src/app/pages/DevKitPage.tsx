import { zodResolver } from '@hookform/resolvers/zod';
import { Bell, Filter, RefreshCw, Settings, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { APPOINTMENT_STATUSES } from '@/shared/lib/appointment-status';
import {
  Button,
  Checkbox,
  CheckboxField,
  DateField,
  Dialog,
  DialogContent,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  ErrorState,
  Fab,
  FilterChip,
  IconButton,
  Input,
  KpiTile,
  MiniCalendar,
  NumberField,
  PageHeader,
  Panel,
  PhoneField,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SegmentControl,
  SelectField,
  Sheet,
  SheetContent,
  SheetTrigger,
  Skeleton,
  StatusBadge,
  Switch,
  TextareaField,
  TextField,
  toast,
  Tooltip,
} from '@/shared/ui';

/** Витрина UI-кита (только dev). Новый компонент в shared/ui → добавь его сюда. */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Panel className="flex flex-col gap-4 p-5">
      <h2 className="text-label">{title}</h2>
      {children}
    </Panel>
  );
}

const SWATCHES = [
  ['ink', 'bg-ink'],
  ['ink-muted', 'bg-ink-muted'],
  ['ink-faint', 'bg-ink-faint'],
  ['canvas', 'bg-canvas'],
  ['canvas-sunken', 'bg-canvas-sunken'],
  ['hairline', 'bg-hairline'],
  ['accent', 'bg-accent'],
  ['accent-hover', 'bg-accent-hover'],
  ['accent-tint', 'bg-accent-tint'],
  ['danger', 'bg-danger'],
  ['danger-tint', 'bg-danger-tint'],
] as const;

const TYPE_SCALE = ['text-title', 'text-subtitle', 'text-label', 'text-body', 'text-caption', 'text-micro'] as const;

const demoSchema = z.object({
  name: z.string().min(2, 'errors.required'),
  phone: z.string().min(11, 'Введите номер полностью'),
  visits: z.number().min(0).optional(),
  date: z.string().min(1, 'errors.required'),
  doctor: z.string().min(1, 'errors.required'),
  comment: z.string().optional(),
  sms: z.boolean(),
});

function DemoForm() {
  const { control, handleSubmit } = useForm<z.infer<typeof demoSchema>>({
    resolver: zodResolver(demoSchema),
    defaultValues: { name: '', phone: '', date: '', doctor: '', comment: '', sms: true },
  });
  return (
    <form
      noValidate
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={handleSubmit((values) => {
        toast.success('Форма валидна', { description: JSON.stringify(values) });
      })}
    >
      <TextField control={control} name="name" label="Пациент" required placeholder="Иванов Иван" />
      <PhoneField control={control} name="phone" label="Телефон" required />
      <NumberField control={control} name="visits" label="Визитов" hint="Необязательное поле" />
      <DateField control={control} name="date" label="Дата приёма" required />
      <SelectField
        control={control}
        name="doctor"
        label="Специалист"
        required
        placeholder="Выберите"
        options={[
          { value: '1', label: 'Петрова А. С. — терапевт' },
          { value: '2', label: 'Ким Д. В. — ортодонт' },
        ]}
      />
      <TextareaField control={control} name="comment" label="Комментарий" className="sm:col-span-2" />
      <CheckboxField control={control} name="sms" label="Отправить SMS-напоминание" />
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="reset">Сбросить</Button>
        <Button type="submit" variant="primary">
          Проверить
        </Button>
      </div>
    </form>
  );
}

export function DevKitPage() {
  const [view, setView] = useState<'doctors' | 'offices'>('doctors');
  const [chips, setChips] = useState({ mine: true, free: false });
  const [day, setDay] = useState(() => new Date());

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="UI-кит"
        subtitle="Токены и компоненты из docs/design-system.md"
        actions={
          <Button variant="primary" onClick={() => toast('Тост', { description: 'Уведомление через sonner' })}>
            Показать тост
          </Button>
        }
      />

      <Section title="Цвета">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {SWATCHES.map(([name, cls]) => (
            <div key={name} className="flex flex-col gap-1">
              <div className={`h-10 rounded-sm border border-hairline ${cls}`} />
              <code className="text-micro text-ink-muted">{name}</code>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {APPOINTMENT_STATUSES.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </Section>

      <Section title="Типографика">
        {TYPE_SCALE.map((cls) => (
          <p key={cls} className={cls}>
            {cls} — Иванова Мария, 10:30, консультация
          </p>
        ))}
      </Section>

      <Section title="Кнопки">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary">Записать</Button>
          <Button>Отмена</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">
            <Trash2 />
            Удалить
          </Button>
          <Button variant="link">Ссылка</Button>
          <Button size="sm">Маленькая</Button>
          <Button disabled>Disabled</Button>
          <Tooltip content="Обновить">
            <IconButton label="Обновить">
              <RefreshCw />
            </IconButton>
          </Tooltip>
          <IconButton label="Уведомления">
            <Bell />
          </IconButton>
          <IconButton label="Настройки">
            <Settings />
          </IconButton>
        </div>
      </Section>

      <Section title="Тулбар: сегмент-контрол и filter-chip">
        <div className="flex flex-wrap items-center gap-3">
          <SegmentControl
            label="Режим журнала"
            value={view}
            onChange={setView}
            options={[
              { value: 'doctors', label: 'По специалистам' },
              { value: 'offices', label: 'По кабинетам' },
            ]}
          />
          <FilterChip pressed={chips.mine} onPressedChange={(mine) => setChips((c) => ({ ...c, mine }))}>
            <Users />
            Мои пациенты
          </FilterChip>
          <FilterChip pressed={chips.free} onPressedChange={(free) => setChips((c) => ({ ...c, free }))}>
            <Filter />
            Свободные окна
          </FilterChip>
        </div>
      </Section>

      <Section title="Мини-календарь">
        <div className="w-60">
          <MiniCalendar value={day} onChange={setDay} />
        </div>
      </Section>

      <Section title="Поля и формы">
        <div className="flex flex-wrap items-center gap-4">
          <Input placeholder="Поиск пациента" className="max-w-xs" />
          <label className="flex items-center gap-2 text-body">
            <Checkbox defaultChecked /> Чекбокс
          </label>
          <label className="flex items-center gap-2 text-body">
            <Switch defaultChecked /> Переключатель
          </label>
        </div>
        <DemoForm />
      </Section>

      <Section title="Оверлеи">
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Модалка</Button>
            </DialogTrigger>
            <DialogContent
              title="Новая запись"
              description="Модалка: радиус lg, тень «поднято»"
              footer={<Button variant="primary">Сохранить</Button>}
            >
              <p className="text-body text-ink-muted">Содержимое модалки.</p>
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger asChild>
              <Button>Шторка</Button>
            </SheetTrigger>
            <SheetContent title="Карточка записи">
              <p className="p-5 text-body text-ink-muted">Редактор записи открывается здесь.</p>
            </SheetContent>
          </Sheet>
          <Popover>
            <PopoverTrigger asChild>
              <Button>Поповер</Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 text-body">Быстрый просмотр записи.</PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>Меню</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Перенести</DropdownMenuItem>
              <DropdownMenuItem>Подтвердить</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive>Отменить запись</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Section>

      <Section title="KPI-плитки">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile label="Записей сегодня" value="48" delta={12} hint="к прошлой неделе" />
          <KpiTile label="Выручка" value="312 400 ₽" delta={-4} hint="к прошлой неделе" />
          <KpiTile label="Новых пациентов" value="9" />
          <KpiTile label="Загрузка кабинетов" value="76%" delta={3} />
        </div>
      </Section>

      <Section title="Состояния">
        <div className="grid gap-3 lg:grid-cols-3">
          <Panel className="flex flex-col gap-2 p-4">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4 w-3/4" />
          </Panel>
          <Panel>
            <EmptyState description="Записей на этот день нет" />
          </Panel>
          <Panel>
            <ErrorState onRetry={() => toast('Повтор')} />
          </Panel>
        </div>
      </Section>

      <Fab label="Быстрая запись" onClick={() => toast('FAB')} />
    </div>
  );
}
