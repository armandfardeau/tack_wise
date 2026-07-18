import { fireEvent, render, screen } from '@testing-library/react';
import GridSettingsButton from '../src/components/GridSettingsButton';

describe('GridSettingsButton', () => {
  it('opens magnetic grid settings', () => {
    const onOpenInspector = jest.fn();

    render(<GridSettingsButton onOpenInspector={onOpenInspector} />);

    fireEvent.click(screen.getByRole('button', { name: /open canvas settings/i }));

    expect(onOpenInspector).toHaveBeenCalledTimes(1);
  });
});
