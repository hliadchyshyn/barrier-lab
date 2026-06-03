import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { SplitTable } from '../../src/features/stats/SplitTable';
import type { SplitStat } from '../../src/types';

const splits: SplitStat[] = [
  { label: 'Start→H1', duration: 2.75, isInterHurdle: false },
  { label: 'H1→H2',   duration: 1.35, isInterHurdle: true  },
];

describe('SplitTable', () => {
  it('renders split labels and times', () => {
    render(
      <MantineProvider>
        <SplitTable splits={splits} bestHurdleIndex={null} worstHurdleIndex={null} />
      </MantineProvider>
    );
    expect(screen.getByText('Start→H1')).toBeInTheDocument();
    expect(screen.getByText('2.750')).toBeInTheDocument();
  });
});
