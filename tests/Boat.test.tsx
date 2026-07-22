import { createElement, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import Boat from '../src/components/Boat';
import type { Boat as BoatModel } from '../src/types';

jest.mock('react-konva', () => {
  const KonvaNode = ({ children, nodeType, ...props }: { children?: ReactNode; nodeType: string; [key: string]: unknown }) => createElement(
    'div',
    { 'data-testid': `konva-${nodeType}`, ...props },
    children,
  );

  return {
    Circle: (props: Record<string, unknown>) => <KonvaNode nodeType="circle" {...props} />,
    Group: (props: Record<string, unknown>) => <KonvaNode nodeType="group" {...props} />,
    Line: (props: Record<string, unknown>) => <KonvaNode nodeType="line" {...props} />,
    Path: (props: Record<string, unknown>) => <KonvaNode nodeType="path" {...props} />,
    Rect: (props: Record<string, unknown>) => <KonvaNode nodeType="rect" {...props} />,
    Text: (props: Record<string, unknown>) => <KonvaNode nodeType="text" {...props} />,
  };
});

const boat: BoatModel = {
  id: 'boat-1',
  name: 'Alpha',
  color: '#38bdf8',
  x: 200,
  y: 350,
  heading: 45,
  sailAngle: 0,
};

describe('Boat speech bubble', () => {
  it('renders a readable bubble only when the boat has a message', () => {
    const { rerender } = render(<Boat boat={{ ...boat, speechBubble: 'Room to tack?' }} isSelected={false} readOnly />);

    expect(screen.getAllByTestId('konva-text')).toHaveLength(2);
    expect(screen.getAllByTestId('konva-text').find((textNode) => textNode.getAttribute('text') === 'Room to tack?')).toBeInTheDocument();

    rerender(<Boat boat={{ ...boat, speechBubble: '   ' }} isSelected={false} readOnly />);
    expect(screen.getAllByTestId('konva-text')).toHaveLength(1);
  });
});

describe('Boat sail rendering', () => {
  it('renders a filled, closed mainsail with trim detail', () => {
    render(<Boat boat={{ ...boat, sailAngle: 35 }} isSelected={false} readOnly />);

    const sail = screen.getAllByTestId('konva-path').find((path) => (
      path.getAttribute('fill') === boat.color
      && path.getAttribute('data')?.startsWith('M 0 -52')
    ));

    expect(sail).toBeInTheDocument();
    expect(sail).toHaveAttribute('opacity', '0.28');
    expect(screen.getAllByTestId('konva-path').filter((path) => path.getAttribute('data')?.startsWith('M 0')).length).toBeGreaterThanOrEqual(4);
  });

  it('uses the improved sail silhouette for cumulative-frame shadows', () => {
    render(<Boat boat={{ ...boat, sailAngle: -35 }} isSelected={false} isShadow />);

    const sail = screen.getAllByTestId('konva-path').find((path) => (
      path.getAttribute('fill') === '#94a3b8'
      && path.getAttribute('data')?.includes('Z')
    ));

    expect(sail).toBeInTheDocument();
    expect(sail).toHaveAttribute('opacity', '0.65');
  });
});
