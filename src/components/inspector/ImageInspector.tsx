import { InspectorTabs } from './InspectorTabs';
import type { InspectorView } from './types';

type ImageInspectorProps = Extract<InspectorView, { kind: 'image' }>;

export function ImageInspector({ image, updateImage }: ImageInspectorProps) {
  return (
    <InspectorTabs
      label="Image"
      tabs={[
        {
          id: 'settings',
          label: 'Settings',
          content: (
            <div className="editor-form">
              <div className="form-row"><label htmlFor="image-name">Name</label><input id="image-name" type="text" value={image.name} onChange={(event) => updateImage(image.id, { name: event.target.value })} /></div>
              <div className="form-row"><label htmlFor="image-width">Width ({image.width}px)</label><input id="image-width" type="range" min="40" max="800" value={image.width} onChange={(event) => updateImage(image.id, { width: Number(event.target.value) })} /></div>
            </div>
          ),
        },
        {
          id: 'display',
          label: 'Display',
          content: (
            <div className="editor-form">
              <div className="form-row"><label htmlFor="image-rotation">Rotation ({image.rotation ?? 0}°)</label><input id="image-rotation" type="range" min="0" max="359" value={image.rotation ?? 0} onChange={(event) => updateImage(image.id, { rotation: Number(event.target.value) })} /></div>
            </div>
          ),
        },
      ]}
    />
  );
}
