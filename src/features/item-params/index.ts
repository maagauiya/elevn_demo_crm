// Публичный API фичи item-params (общая для треков A и B): входные параметры пункта меню
// (WINPUTPARAMS → WAGetItemParams / WAGetItemParamDict). Используют дашборды, графики, движок таблиц.
export { ItemParamsBar } from './components/ItemParamsBar';
export { useItemParamsState, type ItemParamsState, type ParamValues } from './model/use-item-params-state';
export { useItemParams, useParamDict, type ItemParam, type DictOption } from './api/params-api';
export { fieldKind, type FieldKind } from './model/field-types';
