import { useEffect, useMemo, useRef, useState } from 'react';
import { Clipboard, ExternalLink, FileCode, GitPullRequest, X } from 'lucide-react';
import posthog from 'posthog-js';
import type { Frame } from '../types';
import useModalFocus, { type ModalFocusRef } from '../hooks/useModalFocus';
import {
  buildTemplateContributionDraft,
  DEFAULT_TEMPLATE_REPOSITORY,
  templateFileNameFromTitle,
  type TemplateContributionMode,
  type TemplateRepositoryConfig,
  validateTemplateContribution,
} from '../utils/templateContribution';

interface TemplateContributionDialogProps {
  mode: TemplateContributionMode;
  frames: Frame[];
  initialTitle: string;
  existingTemplateIds: string[];
  templateId?: string;
  repository?: TemplateRepositoryConfig;
  returnFocusRef?: ModalFocusRef;
  onClose: () => void;
}

export default function TemplateContributionDialog({
  mode,
  frames,
  initialTitle,
  existingTemplateIds,
  templateId,
  repository = DEFAULT_TEMPLATE_REPOSITORY,
  returnFocusRef,
  onClose,
}: TemplateContributionDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [fileName, setFileName] = useState(() => mode === 'update' && templateId ? `${templateId}.json` : templateFileNameFromTitle(initialTitle));
  const [copyFeedback, setCopyFeedback] = useState('');
  const [fallbackValue, setFallbackValue] = useState('');
  const [fallbackLabel, setFallbackLabel] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useModalFocus<HTMLElement>({ initialFocusRef: titleInputRef, returnFocusRef });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const input = useMemo(() => ({
    mode,
    title,
    fileName,
    frames,
    existingTemplateIds,
    templateId,
    repository,
  }), [existingTemplateIds, fileName, frames, mode, repository, templateId, title]);
  const errors = useMemo(() => validateTemplateContribution(input), [input]);
  const draft = useMemo(() => errors.length === 0 ? buildTemplateContributionDraft(input) : null, [errors.length, input]);

  const copyValue = async (value: string, label: string) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(value);
      setFallbackValue('');
      setFallbackLabel('');
      setCopyFeedback(`${label} copied to the clipboard.`);
    } catch {
      setFallbackValue(value);
      setFallbackLabel(label);
      setCopyFeedback(`Select and copy the ${label.toLowerCase()} below.`);
    }
  };

  const handleOpenGitHub = () => {
    if (!draft) return;
    posthog.capture('template_contribution_submitted', { mode });
    window.open(draft.githubEditorUrl, '_blank', 'noopener,noreferrer');
    void copyValue(draft.content, 'template JSON');
  };

  return (
    <div
      className="template-contribution-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section ref={dialogRef} className="template-contribution-dialog" role="dialog" aria-modal="true" aria-labelledby="template-contribution-title" tabIndex={-1}>
        <div className="template-contribution-header">
          <div>
            <p className="template-contribution-eyebrow">GitHub contribution</p>
            <h2 id="template-contribution-title">
              {mode === 'create' ? 'Submit a template pull request' : 'Update template pull request'}
            </h2>
          </div>
          <button type="button" className="template-contribution-close" aria-label="Close template contribution dialog" onClick={onClose}>
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <p className="template-contribution-intro">
          The app will prepare the source JSON and open GitHub&apos;s editor. Paste the copied JSON, commit it to a new branch, then choose the option to open a pull request.
        </p>

        <div className="template-contribution-form">
          <label className="template-contribution-field">
            <span>Template title</span>
            <input
              aria-label="Template title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              ref={titleInputRef}
            />
          </label>
          <label className="template-contribution-field">
            <span>Source filename</span>
            <input
              aria-label="Template filename"
              value={fileName}
              onChange={(event) => setFileName(event.target.value)}
              disabled={mode === 'update'}
            />
          </label>
        </div>

        {errors.length > 0 && (
          <div className="template-contribution-errors" role="alert">
            {errors.map((error) => <p key={`${error.field}-${error.message}`}>{error.message}</p>)}
          </div>
        )}

        {draft && <>
          <div className="template-contribution-path">
            <FileCode aria-hidden="true" size={15} />
            <code>{draft.path}</code>
          </div>
          <label className="template-contribution-preview">
            <span>Template JSON preview</span>
            <textarea aria-label="Template JSON preview" readOnly value={draft.content} rows={7} />
          </label>
          <div className="template-contribution-metadata">
            <label>
              <span>Suggested commit message</span>
              <input aria-label="Suggested commit message" readOnly value={draft.commitMessage} />
            </label>
            <label>
              <span>Suggested pull request title</span>
              <input aria-label="Suggested pull request title" readOnly value={draft.pullRequestTitle} />
            </label>
            <label>
              <span>Suggested pull request body</span>
              <textarea aria-label="Suggested pull request body" readOnly value={draft.pullRequestBody} rows={4} />
            </label>
          </div>
        </>}

        {fallbackValue && <label className="template-contribution-fallback">
          <span>{fallbackLabel}</span>
          <textarea aria-label={`${fallbackLabel} fallback`} value={fallbackValue} readOnly rows={5} onFocus={(event) => event.currentTarget.select()} />
        </label>}

        {copyFeedback && <p className="template-contribution-feedback" role="status">{copyFeedback}</p>}

        <div className="template-contribution-actions">
          <button type="button" className="template-contribution-secondary" onClick={onClose}>Cancel</button>
          <div className="template-contribution-copy-actions">
            <button type="button" className="template-contribution-secondary" disabled={!draft} onClick={() => draft && void copyValue(draft.content, 'template JSON')}>
              <Clipboard aria-hidden="true" size={15} /> Copy JSON
            </button>
            <button type="button" className="template-contribution-secondary" disabled={!draft} onClick={() => draft && void copyValue(`${draft.commitMessage}\n\n${draft.pullRequestTitle}\n\n${draft.pullRequestBody}`, 'pull request details')}>
              <Clipboard aria-hidden="true" size={15} /> Copy PR details
            </button>
          </div>
          <button type="button" className="template-contribution-primary" disabled={!draft} onClick={() => void handleOpenGitHub()}>
            <GitPullRequest aria-hidden="true" size={16} /> Open GitHub editor <ExternalLink aria-hidden="true" size={14} />
          </button>
        </div>
      </section>
    </div>
  );
}
