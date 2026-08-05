import { createElement, type ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Boat from '../src/components/Boat';
import type { Boat as BoatModel } from '../src/types';

jest.mock('react-konva', () => {
  const KonvaNode = ({ children, nodeType, onDblClick, strokeWidth, ...props }: { children?: ReactNode; nodeType: string; onDblClick?: () => void; strokeWidth?: unknown; [key: string]: unknown }) => createElement(
    'div',
    { 'data-testid': `konva-${nodeType}`, 'data-stroke-width': strokeWidth, onDoubleClick: onDblClick, ...props },
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

  it('renders a judge boat as a powered craft with a flag and wake', () => {
    render(<Boat boat={{ ...boat, type: 'judge', name: 'Umpire' }} isSelected={false} readOnly />);

    expect(screen.getAllByTestId('konva-path').some((pathNode) => (
      pathNode.getAttribute('data')?.startsWith('M 0 -62 C 21 -54')
    ))).toBe(true);
    expect(screen.getAllByTestId('konva-line').some((lineNode) => (
      lineNode.getAttribute('points')?.includes('-12,52,-24,70,-35,82')
    ))).toBe(true);
  });

  it('opens the inspector on double-click', () => {
    const onOpenInspector = jest.fn();

    render(<Boat boat={boat} isSelected={false} onOpenInspector={onOpenInspector} />);

    fireEvent.doubleClick(screen.getAllByTestId('konva-group')[0]);

    expect(onOpenInspector).toHaveBeenCalledTimes(1);
  });
});

describe('Boat sail sizing', () => {
  it('renders the enlarged sail geometry in normal and shadow layers', () => {
    const { rerender } = render(<Boat boat={{ ...boat, sailAngle: 0 }} isSelected={false} readOnly />);

    const normalBoom = screen.getAllByTestId('konva-line').find((lineNode) => (
      lineNode.getAttribute('points')?.startsWith('0,-12,')
    ));
    const normalSail = screen.getAllByTestId('konva-path').find((pathNode) => (
      pathNode.getAttribute('data')?.startsWith('M 0 -12 Q')
    ));

    expect(normalBoom).toBeDefined();
    expect(normalSail).toBeDefined();
    expect(normalSail).toHaveAttribute('data-stroke-width', '6');

    rerender(<Boat boat={{ ...boat, sailAngle: 0 }} isSelected={false} isShadow readOnly />);

    const shadowBoom = screen.getAllByTestId('konva-line').find((lineNode) => (
      lineNode.getAttribute('points')?.startsWith('0,-12,')
    ));
    const shadowSail = screen.getAllByTestId('konva-path').find((pathNode) => (
      pathNode.getAttribute('data')?.startsWith('M 0 -12 Q')
    ));

    expect(shadowBoom).toBeDefined();
    expect(shadowSail).toBeDefined();
    expect(shadowBoom).toHaveAttribute('data-stroke-width', '3');
    expect(shadowSail).toHaveAttribute('data-stroke-width', '4.5');
  });

  it('keeps the enlarged boom anchored while honoring positive and negative sail angles', () => {
    const { rerender } = render(<Boat boat={{ ...boat, sailAngle: 60 }} isSelected readOnly />);
    const getBoomEndpoint = () => {
      const boom = screen.getAllByTestId('konva-line').find((lineNode) => (
        lineNode.getAttribute('points')?.startsWith('0,-12,')
      ));
      const points = boom?.getAttribute('points')?.split(',').map(Number);
      if (!points || points.length < 4 || points.some((point) => Number.isNaN(point))) {
        throw new Error('Expected a racing sail boom line');
      }
      return { x: points[2], y: points[3] };
    };

    const positiveAngleEndpoint = getBoomEndpoint();
    expect(positiveAngleEndpoint.x).toBeLessThan(0);
    expect(Math.hypot(positiveAngleEndpoint.x, positiveAngleEndpoint.y + 12)).toBeCloseTo(54);

    rerender(<Boat boat={{ ...boat, sailAngle: -60 }} isSelected readOnly />);

    const negativeAngleEndpoint = getBoomEndpoint();
    expect(negativeAngleEndpoint.x).toBeGreaterThan(0);
    expect(Math.hypot(negativeAngleEndpoint.x, negativeAngleEndpoint.y + 12)).toBeCloseTo(54);
  });
});
