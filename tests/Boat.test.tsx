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
