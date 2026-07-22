import { render, screen } from '@testing-library/react';
import ExportOverlay from '../src/components/ExportOverlay';

describe('ExportOverlay', () => {
  it('explains the first-use preparation delay', () => {
    render(<ExportOverlay exportPhase="preparing" exportProgress={0} exportType="mp4" />);

    expect(screen.getByRole('status')).toHaveTextContent(/loading advanced export tools/i);
    expect(screen.getByRole('status')).toHaveTextContent(/encoder downloads and initializes/i);
    expect(screen.getByRole('status')).not.toHaveTextContent(/0%/);
  });

  it('shows capture progress for animated exports', () => {
    render(<ExportOverlay exportPhase="capturing" exportProgress={45} exportType="gif" />);

    expect(screen.getByRole('status')).toHaveTextContent('Rendering frames... 45%');
  });

  it('shows encoding progress for video exports', () => {
    render(<ExportOverlay exportPhase="encoding" exportProgress={72} exportType="webm" />);

    expect(screen.getByRole('status')).toHaveTextContent('Encoding video... 72%');
  });
});
