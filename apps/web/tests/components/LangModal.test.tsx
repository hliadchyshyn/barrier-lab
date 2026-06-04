import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { LangModal } from '../../src/components/LangModal';
import '../../src/i18n';

function wrap(ui: React.ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('LangModal', () => {
  it('renders both language buttons when open', () => {
    wrap(<LangModal opened={true} onSelect={() => {}} />);
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Українська' })).toBeInTheDocument();
  });

  it('calls onSelect("uk") when Українська is clicked', async () => {
    const onSelect = vi.fn();
    wrap(<LangModal opened={true} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: 'Українська' }));
    expect(onSelect).toHaveBeenCalledWith('uk');
  });

  it('calls onSelect("en") when English is clicked', async () => {
    const onSelect = vi.fn();
    wrap(<LangModal opened={true} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(onSelect).toHaveBeenCalledWith('en');
  });

  it('renders nothing visible when closed', () => {
    wrap(<LangModal opened={false} onSelect={() => {}} />);
    expect(screen.queryByRole('button', { name: 'English' })).not.toBeInTheDocument();
  });
});
