import { render, screen } from '@testing-library/react';
import FrameHeader from '../src/components/FrameHeader';

describe('FrameHeader', () => {
  it('shows the active frame title and number', () => {
    render(<FrameHeader frameName="Mark approach" frameIndex={1} frameCount={4} showTitle showNumber />);

    expect(screen.getByRole('heading', { name: 'Mark approach' })).toBeInTheDocument();
    expect(screen.getByText('Frame 2 of 4')).toBeInTheDocument();
  });

  it('supports hiding either label independently', () => {
    const { rerender } = render(<FrameHeader frameName="Mark approach" frameIndex={1} frameCount={4} showTitle={false} showNumber />);

    expect(screen.queryByRole('heading', { name: 'Mark approach' })).not.toBeInTheDocument();
    expect(screen.getByText('Frame 2 of 4')).toBeInTheDocument();

    rerender(<FrameHeader frameName="Mark approach" frameIndex={1} frameCount={4} showTitle showNumber={false} />);

    expect(screen.getByRole('heading', { name: 'Mark approach' })).toBeInTheDocument();
    expect(screen.queryByText('Frame 2 of 4')).not.toBeInTheDocument();
  });

  it('renders nothing when both labels are hidden', () => {
    const { container } = render(<FrameHeader frameName="Mark approach" frameIndex={1} frameCount={4} showTitle={false} showNumber={false} />);

    expect(container).toBeEmptyDOMElement();
  });
});
