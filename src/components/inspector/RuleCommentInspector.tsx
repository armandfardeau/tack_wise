import { useState } from 'react';
import { X } from 'lucide-react';
import { getRuleReferences, type RuleOffenseTarget, type RuleReference } from '../../types';
import ColorPicker from '../ColorPicker';
import type { InspectorView } from './types';
import styles from './Inspector.module.css';

const COMMON_RULE_REFERENCES: RuleReference[] = [
  { id: 'rrs-10', label: 'RRS 10' },
  { id: 'rrs-11', label: 'RRS 11' },
  { id: 'rrs-12', label: 'RRS 12' },
  { id: 'rrs-13', label: 'RRS 13' },
  { id: 'rrs-14', label: 'RRS 14' },
  { id: 'rrs-15', label: 'RRS 15' },
  { id: 'rrs-16', label: 'RRS 16' },
  { id: 'rrs-17', label: 'RRS 17' },
  { id: 'rrs-18', label: 'RRS 18' },
];

type RuleCommentInspectorProps = Extract<InspectorView, { kind: 'rule-comment' }>;

interface RuleReferencePickerProps {
  activeFrameRules: RuleReference[];
  comment: RuleCommentInspectorProps['comment'];
  updateRuleComment: RuleCommentInspectorProps['updateRuleComment'];
}

function RuleReferencePicker({ activeFrameRules, comment, updateRuleComment }: RuleReferencePickerProps) {
  const [ruleSearch, setRuleSearch] = useState('');
  const ruleOptions = Array.from(new Map(
    [...COMMON_RULE_REFERENCES, ...activeFrameRules, ...getRuleReferences(comment)]
      .map((rule) => [rule.id, rule] as const),
  ).values());
  const selectedRuleIds = getRuleReferences(comment).map((rule) => rule.id);
  const normalizedRuleSearch = ruleSearch.trim().toLowerCase();
  const visibleRuleOptions = ruleOptions.filter((rule) => (
    selectedRuleIds.includes(rule.id)
    || !normalizedRuleSearch
    || `${rule.label} ${rule.description ?? ''}`.toLowerCase().includes(normalizedRuleSearch)
  ));

  const updateRules = (selectedIds: string[]) => {
    updateRuleComment(comment.id, { rules: ruleOptions.filter((rule) => selectedIds.includes(rule.id)) });
  };

  return (
    <div className={styles.formRow}>
      <label htmlFor="rule-reference">Rule references</label>
      <input id="rule-reference-search" type="search" value={ruleSearch} placeholder="Search rules" aria-label="Search rule references" onChange={(event) => setRuleSearch(event.target.value)} />
      <select id="rule-reference" multiple size={Math.min(Math.max(visibleRuleOptions.length, 4), 8)} value={selectedRuleIds} onChange={(event) => updateRules(Array.from(event.target.selectedOptions, (option) => option.value))}>
        {visibleRuleOptions.map((rule) => <option key={rule.id} value={rule.id}>{rule.label}</option>)}
      </select>
      <p className={styles.gridHint}>Select one or more rules.</p>
    </div>
  );
}

interface OffenseTargetEditorProps {
  activeFrame: RuleCommentInspectorProps['activeFrame'];
  comment: RuleCommentInspectorProps['comment'];
  updateRuleComment: RuleCommentInspectorProps['updateRuleComment'];
}

function OffenseTargetEditor({ activeFrame, comment, updateRuleComment }: OffenseTargetEditorProps) {
  const offenseOptions: Array<RuleOffenseTarget & { name: string }> = [
    ...activeFrame.boats.map((boat) => ({ id: boat.id, type: 'boat' as const, name: boat.name })),
    ...activeFrame.marks.map((mark) => ({ id: mark.id, type: 'mark' as const, name: mark.name })),
  ];
  const offenseKey = (target: RuleOffenseTarget) => `${target.type}:${target.id}`;
  const selectedOffenseKeys = new Set(comment.offenseTargets.map(offenseKey));
  const getOffenseName = (target: RuleOffenseTarget) => offenseOptions.find((option) => offenseKey(option) === offenseKey(target))?.name ?? target.id;

  const addOffense = (key: string) => {
    const target = offenseOptions.find((option) => offenseKey(option) === key);
    if (!target || selectedOffenseKeys.has(key)) return;

    updateRuleComment(comment.id, {
      offenseTargets: [...comment.offenseTargets, { id: target.id, type: target.type, color: '#ef4444' }],
    });
  };

  const removeOffense = (target: RuleOffenseTarget) => {
    updateRuleComment(comment.id, { offenseTargets: comment.offenseTargets.filter((candidate) => offenseKey(candidate) !== offenseKey(target)) });
  };

  const updateOffenseColor = (target: RuleOffenseTarget, color: string) => {
    updateRuleComment(comment.id, {
      offenseTargets: comment.offenseTargets.map((candidate) => offenseKey(candidate) === offenseKey(target) ? { ...candidate, color } : candidate),
    });
  };

  return (
    <div className={styles.inspectorSubsection}>
      <h4 className={styles.inspectorSubsectionTitle}>Highlight offending objects</h4>
      <div className={styles.ruleOffenseList}>
        {comment.offenseTargets.map((target) => (
          <div className={styles.ruleOffenseRow} key={offenseKey(target)}>
            <span className={styles.ruleOffenseName}>{getOffenseName(target)}</span>
            <ColorPicker compact aria-label={`Color for ${getOffenseName(target)}`} value={target.color ?? '#ef4444'} onChange={(color) => updateOffenseColor(target, color)} />
            <button type="button" className={styles.ruleOffenseRemove} aria-label={`Remove offending object ${getOffenseName(target)}`} onClick={() => removeOffense(target)}>
              <X aria-hidden="true" size={14} />
            </button>
          </div>
        ))}
        {comment.offenseTargets.length === 0 && <p className={styles.gridHint}>No offending objects highlighted yet.</p>}
      </div>
      <div className={styles.ruleOffenseAdd}>
        <select id="rule-offense-add" defaultValue="" aria-label="Add offending object" onChange={(event) => { addOffense(event.target.value); event.currentTarget.value = ''; }}>
          <option value="">Add offending object…</option>
          {offenseOptions.filter((target) => !selectedOffenseKeys.has(offenseKey(target))).map((target) => <option key={offenseKey(target)} value={offenseKey(target)}>{target.name}</option>)}
        </select>
      </div>
    </div>
  );
}

export function RuleCommentInspector({ activeFrame, comment, updateRuleComment }: RuleCommentInspectorProps) {
  return (
    <div className={styles.editorForm}>
      <div className={styles.formRow}><label htmlFor="rule-comment-name">Name</label><input id="rule-comment-name" type="text" value={comment.name} onChange={(event) => updateRuleComment(comment.id, { name: event.target.value })} /></div>
      <RuleReferencePicker activeFrameRules={activeFrame.rules ?? []} comment={comment} updateRuleComment={updateRuleComment} />
      <div className={styles.formRow}><label htmlFor="rule-comment-color">Highlight color</label><ColorPicker id="rule-comment-color" label="Highlight color" value={comment.color} onChange={(color) => updateRuleComment(comment.id, { color })} /></div>
      <div className={styles.formRow}><label htmlFor="rule-comment-size">Font size ({comment.fontSize ?? 14}px)</label><input id="rule-comment-size" type="range" min="10" max="32" value={comment.fontSize ?? 14} onChange={(event) => updateRuleComment(comment.id, { fontSize: Number(event.target.value) })} /></div>
      <OffenseTargetEditor activeFrame={activeFrame} comment={comment} updateRuleComment={updateRuleComment} />
    </div>
  );
}
