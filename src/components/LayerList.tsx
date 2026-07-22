import type { ComponentType } from 'react';
import { ArrowUpRight, Image, MapPin, MessageSquare, ShipWheel, Wind } from 'lucide-react';
import type { SelectedType } from '../hooks/useScenario';
import { getRuleReferences, type Frame } from '../types';
import styles from './LayerList.module.css';

type LayerObjectType = 'boat' | 'mark' | 'arrow' | 'comment' | 'image';
type LayerIcon = ComponentType<{ 'aria-hidden'?: boolean; size?: number; strokeWidth?: number }>;

interface LayerListProps {
  activeFrame: Frame;
  onOpenInspector: (id: string, type: Exclude<SelectedType, null>) => void;
  selectedId: string | null;
  selectedType: SelectedType;
}

interface LayerEntry {
  id: string;
  name: string;
  type: LayerObjectType;
  icon: LayerIcon;
  color?: string;
  detail?: string;
}

const layerGroups: Array<{ label: string; type: LayerObjectType; icon: LayerIcon }> = [
  { label: 'Boats', type: 'boat', icon: ShipWheel },
  { label: 'Marks', type: 'mark', icon: MapPin },
  { label: 'Tactical arrows', type: 'arrow', icon: ArrowUpRight },
  { label: 'Notes', type: 'comment', icon: MessageSquare },
  { label: 'Images', type: 'image', icon: Image },
];

function getEntries(frame: Frame, type: LayerObjectType): LayerEntry[] {
  switch (type) {
    case 'boat':
      return frame.boats.map((boat) => ({
        id: boat.id,
        name: boat.name || 'Unnamed boat',
        type,
        icon: ShipWheel,
        color: boat.color,
        detail: `${boat.type === 'judge' ? 'Judge boat · ' : ''}${Math.round(boat.heading)}° heading`,
      }));
    case 'mark':
      return frame.marks.map((mark) => ({
        id: mark.id,
        name: mark.name || 'Unnamed mark',
        type,
        icon: MapPin,
        color: mark.color,
        detail: mark.shape,
      }));
    case 'arrow':
      return (frame.arrows ?? []).map((arrow) => ({
        id: arrow.id,
        name: arrow.name || 'Unnamed arrow',
        type,
        icon: ArrowUpRight,
        color: arrow.color,
        detail: arrow.curved ? 'Curved' : 'Straight',
      }));
    case 'comment':
      return (frame.comments ?? []).map((comment) => ({
        id: comment.id,
        name: comment.name || 'Unnamed note',
        type,
        icon: MessageSquare,
        color: comment.color,
        detail: comment.type === 'rule' ? getRuleReferences(comment).map((rule) => rule.label).join(', ') : undefined,
      }));
    case 'image':
      return (frame.images ?? []).map((image) => ({
        id: image.id,
        name: image.name || 'Diagram image',
        type,
        icon: Image,
        detail: `${Math.round(image.width)} × ${Math.round(image.height)}`,
      }));
  }
}

export default function LayerList({
  activeFrame,
  onOpenInspector,
  selectedId,
  selectedType,
}: LayerListProps) {
  const entries = layerGroups.flatMap((group) => getEntries(activeFrame, group.type));
  const layerCount = entries.length + 1;

  return (
    <div className={styles.layersList}>
      <p className={styles.layersSummary}>{layerCount} {layerCount === 1 ? 'layer' : 'layers'} in this frame</p>
      <button
        type="button"
        className={`${styles.layerRow}${selectedId === 'wind' && selectedType === 'wind' ? ` ${styles.isSelected}` : ''}`}
        aria-pressed={selectedId === 'wind' && selectedType === 'wind'}
        onClick={() => onOpenInspector('wind', 'wind')}
      >
        <span className={`${styles.layerRowIcon} ${styles.isWind}`}><Wind aria-hidden="true" size={15} /></span>
        <span className={styles.layerRowCopy}>
          <span className={styles.layerRowName}>Wind</span>
          <span className={styles.layerRowDetail}>{activeFrame.windSpeed} kts · {activeFrame.windAngle}°</span>
        </span>
      </button>

      {layerGroups.map((group) => {
        const groupEntries = getEntries(activeFrame, group.type);
        if (groupEntries.length === 0) return null;
        const GroupIcon = group.icon;

        return (
          <section key={group.type} className={styles.layerGroup} aria-labelledby={`layer-group-${group.type}`}>
            <h4 id={`layer-group-${group.type}`} className={styles.layerGroupTitle}>
              <GroupIcon aria-hidden={true} size={13} />
              <span>{group.label}</span>
              <span className={styles.layerGroupCount}>{groupEntries.length}</span>
            </h4>
            <div className={styles.layerGroupItems}>
              {groupEntries.map((entry) => {
                const EntryIcon = entry.icon;
                const isSelected = selectedId === entry.id && selectedType === entry.type;

                return (
                  <button
                    key={entry.id}
                    type="button"
                    className={`${styles.layerRow}${isSelected ? ` ${styles.isSelected}` : ''}`}
                    aria-pressed={isSelected}
                    onClick={() => onOpenInspector(entry.id, entry.type)}
                  >
                    <span className={styles.layerRowIcon} style={entry.color ? { color: entry.color } : undefined}>
                      <EntryIcon aria-hidden={true} size={15} />
                    </span>
                    <span className={styles.layerRowCopy}>
                      <span className={styles.layerRowName}>{entry.name}</span>
                      {entry.detail && <span className={styles.layerRowDetail}>{entry.detail}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      {entries.length === 0 && <p className={styles.layersEmpty}>Add an object to the canvas and it will appear here.</p>}
    </div>
  );
}
