import { createElement, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import Mark from '../src/components/Mark';
import type { Mark as MarkModel } from '../src/types';

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
    Rect: (props: Record<string, unknown>) => <KonvaNode nodeType="rect" {...props} />,
    RegularPolygon: (props: Record<string, unknown>) => <KonvaNode nodeType="regular-polygon" {...props} />,
    Text: (props: Record<string, unknown>) => <KonvaNode nodeType="text" {...props} />,
  };
});

const triangleMark: MarkModel = {
  id: 'mark-1',
  name: 'Windward mark',
  color: '#ef4444',
  x: 300,
  y: 120,
  shape: 'triangle',
};

describe('Mark', () => {
  it('renders an enabled zone at three boat lengths by default', () => {
    render(<Mark mark={{ ...triangleMark, showZone: true }} isSelected={false} readOnly />);

    const zone = screen.getByTestId('konva-circle');
    expect(zone).toHaveAttribute('radius', '165');
    expect(zone).toHaveAttribute('dash', '10,8');
  });

  it('uses the configured zone radius and omits the zone when disabled', () => {
    const { rerender } = render(<Mark mark={{ ...triangleMark, showZone: true, zoneRadius: 4 }} isSelected={false} readOnly />);

    expect(screen.getByTestId('konva-circle')).toHaveAttribute('radius', '220');

    rerender(<Mark mark={triangleMark} isSelected={false} readOnly />);
    expect(screen.queryByTestId('konva-circle')).not.toBeInTheDocument();
  });
});
