import { Table, Badge } from '@mantine/core';
import type { SplitStat } from '../../types';

interface Props {
  splits: SplitStat[];
  bestHurdleIndex: number | null;
  worstHurdleIndex: number | null;
}

export function SplitTable({ splits, bestHurdleIndex, worstHurdleIndex }: Props) {
  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Segment</Table.Th>
          <Table.Th>Time (s)</Table.Th>
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
                {s.isPB  && <Badge color="yellow" size="xs" mr={4}>PB</Badge>}
                {isBest  && <Badge color="green"  size="xs" mr={4}>Best</Badge>}
                {isWorst && <Badge color="red"    size="xs">Worst</Badge>}
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}
