import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import '../../src/i18n';
import { EventTimeline } from '../../src/features/annotate/EventTimeline';
import type { HurdleEvent } from '../../src/types';

const events: HurdleEvent[] = [
  { type: 'start', videoTime: 0 },
  { type: 'hurdle', hurdleIndex: 1, videoTime: 2.75 },
  { type: 'finish', videoTime: 13.75 },
];

const wrap = (ui: React.ReactElement) => render(<MantineProvider>{ui}</MantineProvider>);

describe('EventTimeline', () => {
  it('renders event markers', () => {
    wrap(<EventTimeline events={events} duration={14} onSeek={vi.fn()} currentTime={0} selectedEventIdx={null} onSelectEvent={() => {}} />);
    expect(screen.getByTitle('Start')).toBeInTheDocument();
    expect(screen.getByTitle('H1')).toBeInTheDocument();
    expect(screen.getByTitle('Finish')).toBeInTheDocument();
  });

  it('calls onSeek when marker is clicked', () => {
    const onSeek = vi.fn();
    wrap(<EventTimeline events={events} duration={14} onSeek={onSeek} currentTime={0} selectedEventIdx={null} onSelectEvent={() => {}} />);
    fireEvent.click(screen.getByTitle('H1'));
    expect(onSeek).toHaveBeenCalledWith(2.75);
  });
});
