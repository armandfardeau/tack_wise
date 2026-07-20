import type { Frame } from '../types';
import { parseScenarioFromJson } from './exporter';

export const TEMPLATE_DIRECTORY = 'src/data/situations';

export interface TemplateRepositoryConfig {
  owner: string;
  name: string;
  branch: string;
}

export const DEFAULT_TEMPLATE_REPOSITORY: TemplateRepositoryConfig = {
  owner: 'armandfardeau',
  name: 'tack_wise',
  branch: 'main',
};

export type TemplateContributionMode = 'create' | 'update';

export interface TemplateContributionInput {
  mode: TemplateContributionMode;
  title: string;
  fileName: string;
  frames: Frame[];
  existingTemplateIds: string[];
  templateId?: string;
  repository?: TemplateRepositoryConfig;
}

export interface TemplateContributionError {
  field: 'title' | 'fileName' | 'template' | 'frames';
  message: string;
}

export interface TemplateContributionDraft {
  mode: TemplateContributionMode;
  title: string;
  fileName: string;
  path: string;
  content: string;
  githubEditorUrl: string;
  commitMessage: string;
  pullRequestTitle: string;
  pullRequestBody: string;
}

export function templateFileNameFromTitle(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${slug || 'template'}.json`;
}

export function templateIdFromFileName(fileName: string) {
  return fileName.trim().replace(/\.json$/i, '');
}

export function parseTemplateRepository(value: string | undefined, branch = 'main'): TemplateRepositoryConfig {
  const parts = value?.trim().split('/');
  const normalizedBranch = branch.trim() || 'main';
  if (!parts || parts.length !== 2 || parts.some((part) => !/^[A-Za-z0-9_.-]+$/.test(part))) {
    return { ...DEFAULT_TEMPLATE_REPOSITORY, branch: normalizedBranch };
  }

  return { owner: parts[0], name: parts[1], branch: normalizedBranch };
}

export function buildGitHubTemplateEditorUrl(
  mode: TemplateContributionMode,
  path: string,
  repository = DEFAULT_TEMPLATE_REPOSITORY,
) {
  const repositoryUrl = `https://github.com/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`;

  if (mode === 'create') {
    const url = new URL(`${repositoryUrl}/new/${encodeURIComponent(repository.branch)}`);
    url.searchParams.set('filename', path);
    return url.toString();
  }

  const encodedPath = path.split('/').map((segment) => encodeURIComponent(segment)).join('/');
  return `${repositoryUrl}/edit/${encodeURIComponent(repository.branch)}/${encodedPath}`;
}

function validateScenarioFrames(title: string, frames: Frame[]): TemplateContributionError | null {
  try {
    parseScenarioFromJson(JSON.stringify({
      version: 2,
      frames,
      currentFrameIndex: 0,
      settings: {
        title,
        displayMode: 'single',
        presenterMode: false,
        showFrameTitle: true,
        showFrameNumber: true,
      },
    }));
    return null;
  } catch {
    return {
      field: 'frames',
      message: 'The current diagram contains invalid scenario data.',
    };
  }
}

export function validateTemplateContribution(input: TemplateContributionInput): TemplateContributionError[] {
  const errors: TemplateContributionError[] = [];
  const title = input.title.trim();
  const fileName = input.fileName.trim();
  const templateId = templateIdFromFileName(fileName);

  if (!title) {
    errors.push({ field: 'title', message: 'Enter a template title.' });
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(fileName)) {
    errors.push({
      field: 'fileName',
      message: 'Use a lowercase kebab-case filename ending in .json.',
    });
  }

  if (input.mode === 'create' && input.existingTemplateIds.includes(templateId)) {
    errors.push({
      field: 'fileName',
      message: 'A template with this filename already exists. Choose another filename or update the existing template.',
    });
  }

  if (input.mode === 'update') {
    if (!input.templateId || !input.existingTemplateIds.includes(input.templateId)) {
      errors.push({
        field: 'template',
        message: 'Load a built-in template before starting an update pull request.',
      });
    } else if (templateId !== input.templateId) {
      errors.push({
        field: 'fileName',
        message: 'The update filename must match the loaded built-in template.',
      });
    }
  }

  if (!Array.isArray(input.frames) || input.frames.length === 0) {
    errors.push({ field: 'frames', message: 'A template must contain at least one frame.' });
  } else if (title) {
    const scenarioError = validateScenarioFrames(title, input.frames);
    if (scenarioError) errors.push(scenarioError);
  }

  return errors;
}

export function buildTemplateContributionDraft(input: TemplateContributionInput): TemplateContributionDraft {
  const errors = validateTemplateContribution(input);
  if (errors.length > 0) throw new Error(errors.map((error) => error.message).join(' '));

  const title = input.title.trim();
  const fileName = input.fileName.trim();
  const path = `${TEMPLATE_DIRECTORY}/${fileName}`;
  const repository = input.repository ?? DEFAULT_TEMPLATE_REPOSITORY;
  const content = `${JSON.stringify({ title, frames: input.frames }, null, 2)}\n`;
  const action = input.mode === 'create' ? 'Add' : 'Update';
  const commitMessage = `${action} template: ${title}`;

  return {
    mode: input.mode,
    title,
    fileName,
    path,
    content,
    githubEditorUrl: buildGitHubTemplateEditorUrl(input.mode, path, repository),
    commitMessage,
    pullRequestTitle: commitMessage,
    pullRequestBody: [
      `## ${action} template`,
      '',
      `Template file: \`${path}\``,
      '',
      'Please review the generated situation and confirm that the template contains no unrelated changes.',
    ].join('\n'),
  };
}
