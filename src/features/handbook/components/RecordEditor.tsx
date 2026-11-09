import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, DialogContent, Skeleton, toast } from '@/shared/ui';
import { useEditorData, useEditorFields, useSaveRecord } from '../api/table-editor';
import { NS } from '../i18n';
import { DynamicField } from './DynamicField';

type Values = Record<string, string>;

/**
 * Редактор записи (WAGetItemEditor/WAGetEditorData/WAEditTable) — открывается из MetaTable
 * по клику на строку (редактирование) или по кнопке «Добавить» (создание, id === undefined).
 */
export function RecordEditor({
  open,
  onOpenChange,
  editorTable,
  editMethodName,
  id,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editorTable: string;
  editMethodName: string;
  id: string | undefined;
  title: string;
}) {
  const { t } = useTranslation(NS);
  const fieldsQuery = useEditorFields(editorTable);
  const dataQuery = useEditorData(editorTable, id);
  const save = useSaveRecord();

  const values = useMemo<Values>(() => {
    const result: Values = {};
    for (const field of fieldsQuery.data ?? []) result[field.name] = '';
    for (const row of dataQuery.data ?? []) result[row.name] = row.fkValue ?? row.value ?? '';
    return result;
  }, [fieldsQuery.data, dataQuery.data]);

  const { control, handleSubmit, formState } = useForm<Values>({ values });

  const isLoading = fieldsQuery.isPending || (!!id && dataQuery.isPending);

  const onSubmit = (submitted: Values) => {
    const changedFields = id
      ? Object.fromEntries(Object.keys(formState.dirtyFields).map((name) => [name, submitted[name] ?? '']))
      : submitted;
    if (Object.keys(changedFields).length === 0) {
      onOpenChange(false);
      return;
    }
    save.mutate(
      { editorTable, editMethodName, id, changedFields },
      {
        onSuccess: () => {
          toast.success(t('editor.saved'));
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={title}
        footer={
          <Button type="submit" form="record-editor-form" disabled={isLoading || save.isPending}>
            {t('editor.save')}
          </Button>
        }
      >
        {isLoading ? (
          <Skeleton className="h-48" />
        ) : (
          <form id="record-editor-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            {fieldsQuery.data
              ?.filter((field) => !field.readOnly)
              .map((field) => (
                <DynamicField key={field.name} field={field} control={control} />
              ))}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
