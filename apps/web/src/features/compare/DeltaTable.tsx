import { Table, Text } from '@mantine/core';
import type { SplitDelta } from '../../types';

interface Props { deltas: SplitDelta[] }

export function DeltaTable({ deltas }: Props) {
  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Segment</Table.Th>
          <Table.Th>Run A</Table.Th>
          <Table.Th>Run B</Table.Th>
          <Table.Th>Delta</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {deltas.map(d => (
          <Table.Tr key={d.label}>
            <Table.Td>{d.label}</Table.Td>
            <Table.Td>{d.durationA?.toFixed(3) ?? '—'}</Table.Td>
            <Table.Td>{d.durationB?.toFixed(3) ?? '—'}</Table.Td>
            <Table.Td>
              {d.delta != null && (
                <Text c={d.delta < 0 ? 'green' : d.delta > 0 ? 'red' : 'dimmed'} fw={600}>
                  {d.delta > 0 ? '+' : ''}{d.delta.toFixed(3)}
                </Text>
              )}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
