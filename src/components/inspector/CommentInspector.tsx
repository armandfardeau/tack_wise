import ColorPicker from '../ColorPicker';
import { InspectorTabs } from './InspectorTabs';
import type { InspectorView } from './types';
import styles from './Inspector.module.css';

type CommentInspectorProps = Extract<InspectorView, { kind: 'comment' }>;

export function CommentInspector({ comment, updateComment }: CommentInspectorProps) {
  return (
    <InspectorTabs
      label="Comment"
      tabs={[
        {
          id: 'content',
          label: 'Content',
          content: (
            <div className={styles.editorForm}>
              <div className={styles.formRow}><label htmlFor="comment-name">Name</label><input id="comment-name" type="text" value={comment.name} onChange={(event) => updateComment(comment.id, { name: event.target.value })} /></div>
              <div className={styles.formRow}><label htmlFor="comment-text">Text</label><textarea id="comment-text" value={comment.text} rows={4} onChange={(event) => updateComment(comment.id, { text: event.target.value })} /></div>
            </div>
          ),
        },
        {
          id: 'display',
          label: 'Display',
          content: (
            <div className={styles.editorForm}>
              <div className={styles.formRow}><label htmlFor="comment-color">Text color</label><ColorPicker id="comment-color" label="Text color" value={comment.color} onChange={(color) => updateComment(comment.id, { color })} /></div>
              <div className={styles.formRow}><label htmlFor="comment-size">Font size ({comment.fontSize ?? 14}px)</label><input id="comment-size" type="range" min="10" max="32" value={comment.fontSize ?? 14} onChange={(event) => updateComment(comment.id, { fontSize: Number(event.target.value) })} /></div>
            </div>
          ),
        },
      ]}
    />
  );
}
