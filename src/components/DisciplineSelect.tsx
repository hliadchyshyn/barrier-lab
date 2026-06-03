import { Select } from '@mantine/core';
import { DISCIPLINE_PRESETS } from '../types';
import type { Discipline } from '../types';

interface Props {
  value: Discipline;
  onChange: (v: Discipline) => void;
}

export function DisciplineSelect({ value, onChange }: Props) {
  const data = Object.entries(DISCIPLINE_PRESETS).map(([k, v]) => ({
    value: k, label: v.label,
  }));
  return (
    <Select data={data} value={value} onChange={v => onChange(v as Discipline)} label="Discipline" />
  );
}
