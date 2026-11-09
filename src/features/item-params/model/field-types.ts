/** FieldTypeId полей из базы (как в старом getInputFromType). */
export const FIELD_TYPE = {
  number: [1, 3],
  textarea: [5, 40],
  date: 6,
  dateTime: 7,
  time: 9,
  dict: 10,
} as const;

export type FieldKind = 'number' | 'textarea' | 'date' | 'datetime' | 'time' | 'dict' | 'text';

export function fieldKind(type: number): FieldKind {
  if ((FIELD_TYPE.number as readonly number[]).includes(type)) return 'number';
  if ((FIELD_TYPE.textarea as readonly number[]).includes(type)) return 'textarea';
  if (type === FIELD_TYPE.date) return 'date';
  if (type === FIELD_TYPE.dateTime) return 'datetime';
  if (type === FIELD_TYPE.time) return 'time';
  if (type === FIELD_TYPE.dict) return 'dict';
  return 'text';
}
