import { createElement, type ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Boat from '../src/components/Boat';
import type { Boat as BoatModel } from '../src/types';

jest.mock('react-konva', () => {
  const KonvaNode = ({ children, nodeType, onDblClick, ...props }: { children?: ReactNode; nodeType: string; onDblClick?: () => void; [key: string]: unknown }) => createElement(
    'div',
    { 'data-testid': `konva-${nodeType}`, onDoubleClick: onDblClick, ...props },
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

  it('opens the inspector on double-click', () => {
    const onOpenInspector = jest.fn();

    render(<Boat boat={boat} isSelected={false} onOpenInspector={onOpenInspector} />);

    fireEvent.doubleClick(screen.getAllByTestId('konva-group')[0]);

    expect(onOpenInspector).toHaveBeenCalledTimes(1);
  });
});

describe('Boat sail plans', () => {
  it('keeps legacy boats mainsail-only and renders each auxiliary sail plan', () => {
    const { rerender } = render(<Boat boat={boat} isSelected={false} readOnly />);
    expect(screen.getAllByTestId('konva-path')).toHaveLength(4);

    rerender(<Boat boat={{ ...boat, sailPlan: 'front-sail', frontSailAngle: 20 }} isSelected={false} readOnly />);
    expect(screen.getAllByTestId('konva-path')).toHaveLength(5);
    expect(screen.getAllByTestId('konva-path').some((path) => path.getAttribute('data')?.includes('L 0 -58'))).toBe(true);

    rerender(<Boat boat={{ ...boat, sailPlan: 'symmetric-spinnaker', spinnakerAngle: 20 }} isSelected={false} readOnly />);
    const symmetricPath = screen.getAllByTestId('konva-path')[4].getAttribute('data');
    expect(symmetricPath).toContain('C');

    rerender(<Boat boat={{ ...boat, sailPlan: 'asymmetric-spinnaker', spinnakerAngle: -20 }} isSelected={false} readOnly />);
    const asymmetricPath = screen.getAllByTestId('konva-path')[4].getAttribute('data');
    expect(asymmetricPath).toContain('C');
    expect(asymmetricPath).not.toBe(symmetricPath);
  });

  it('includes the selected auxiliary sail in ghost boats', () => {
    render(<Boat boat={{ ...boat, sailPlan: 'symmetric-spinnaker' }} isSelected={false} isShadow />);

    expect(screen.getAllByTestId('konva-path')).toHaveLength(3);
  });
});
