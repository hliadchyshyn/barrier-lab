import { Table, Badge } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { SplitStat } from '../../types';

interface Props {
  splits: SplitStat[];
  bestHurdleIndex: number | null;
  worstHurdleIndex: number | null;
}

export function SplitTable({ splits, bestHurdleIndex, worstHurdleIndex }: Props) {
  const { t } = useTranslation();
  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{t('stats.segment')}</Table.Th>
          <Table.Th>{t('stats.time')}</Table.Th>
          <Table.Th></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {splits.map(s => {
          const hNum = Number(s.label.match(/H(\d+)→/)?.[1]);
          const isBest  = s.isInterHurdle && hNum === bestHurdleIndex;
          const isWorst = s.isInterHurdle && hNum === worstHurdleIndex;
          return (
            <Table.Tr key={s.label}>
              <Table.Td>{s.label}</Table.Td>
              <Table.Td>{s.duration.toFixed(3)}</Table.Td>
              <Table.Td>
                {s.isPB  && <Badge color="yellow" size="xs" mr={4}>{t('stats.badge.pb')}</Badge>}
                {isBest  && <Badge color="green"  size="xs" mr={4}>{t('stats.badge.best')}</Badge>}
                {isWorst && <Badge color="red"    size="xs">{t('stats.badge.worst')}</Badge>}
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}
