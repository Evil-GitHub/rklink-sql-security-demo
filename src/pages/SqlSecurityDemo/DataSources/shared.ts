import type { ColProps, RowProps } from 'antd';
import { sourceTypeLabel, type DbKind } from '../mock';

export const ALL_DB_TYPE_KEY = '__all__';

export const FORM_COL_4: ColProps = {
  xs: 24,
  sm: 12,
  md: 12,
  lg: 6,
  xl: 6,
  xxl: 6,
};

export const FORM_COL_FULL: ColProps = {
  span: 24,
};

export const FORM_ROW_GUTTER: RowProps = {
  gutter: [24, 0],
};

export const dbKindOptions = (Object.keys(sourceTypeLabel) as DbKind[]).map((value) => ({
  value,
  label: sourceTypeLabel[value],
}));

export const dbTypeValueEnum = (Object.keys(sourceTypeLabel) as DbKind[]).reduce<Record<string, { text: string }>>(
  (acc, key) => {
    acc[key] = { text: sourceTypeLabel[key] };
    return acc;
  },
  {},
);

export const splitHostPort = (hostValue: string) => {
  const [host, port] = hostValue.split(':');
  return {
    host,
    port: Number(port) || 3306,
  };
};

export const filterText = (text: string | undefined, keyword: unknown) => {
  if (!keyword) return true;
  return (text || '').toLowerCase().includes(String(keyword).toLowerCase());
};
