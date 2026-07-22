import { ensureCurvedArrowControlPoint, toTacticalArrowPoints } from '../../utils/arrows';
import type { InspectorView } from './types';
import ColorPicker from '../ColorPicker';
import { InspectorTabs } from './InspectorTabs';

type ArrowInspectorProps = Extract<InspectorView, { kind: 'arrow' }>;

export function ArrowInspector({ arrow, updateArrow }: ArrowInspectorProps) {
  const handleCurvedChange = (curved: boolean) => {
    updateArrow(arrow.id, {
      curved,
      points: curved
        ? ensureCurvedArrowControlPoint(arrow.points)
        : arrow.points.length > 2
          ? toTacticalArrowPoints([arrow.points[0], arrow.points[arrow.points.length - 1]]) ?? arrow.points
          : arrow.points,
    });
  };

  return (
    <InspectorTabs
      label="Arrow"
      tabs={[
        {
          id: 'settings',
          label: 'Settings',
          content: (
            <div className="editor-form">
              <div className="form-row"><label htmlFor="arrow-name">Name</label><input id="arrow-name" type="text" value={arrow.name} onChange={(event) => updateArrow(arrow.id, { name: event.target.value })} /></div>
              <div className="form-row"><label htmlFor="arrow-color">Color</label><ColorPicker id="arrow-color" label="Color" value={arrow.color} onChange={(color) => updateArrow(arrow.id, { color })} /></div>
              <div className="form-row"><label htmlFor="arrow-width">Line width ({arrow.lineWidth ?? 3}px)</label><input id="arrow-width" type="range" min="1" max="12" value={arrow.lineWidth ?? 3} onChange={(event) => updateArrow(arrow.id, { lineWidth: Number(event.target.value) })} /></div>
              <div className="form-row"><label htmlFor="arrow-style">Line style</label><select id="arrow-style" value={arrow.lineStyle ?? 'solid'} onChange={(event) => updateArrow(arrow.id, { lineStyle: event.target.value as typeof arrow.lineStyle })}><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option></select></div>
            </div>
          ),
        },
        {
          id: 'display',
          label: 'Display',
          content: (
            <div className="editor-form">
              <div className="form-row flex-row"><label className="checkbox-label"><input type="checkbox" checked={!!arrow.curved} onChange={(event) => handleCurvedChange(event.target.checked)} /><span>Curved arrow</span></label></div>
              <div className="form-row flex-row"><label className="checkbox-label"><input type="checkbox" checked={arrow.showArrowhead !== false} onChange={(event) => updateArrow(arrow.id, { showArrowhead: event.target.checked })} /><span>Show arrowhead</span></label></div>
            </div>
          ),
        },
      ]}
    />
  );
}
