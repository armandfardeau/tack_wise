import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Frame } from '../src/types';
import {
  buildGitHubTemplateEditorUrl,
  buildTemplateContributionDraft,
  DEFAULT_TEMPLATE_REPOSITORY,
  parseTemplateRepository,
  templateFileNameFromTitle,
  templateIdFromFileName,
  validateTemplateContribution,
} from '../src/utils/templateContribution';

const validFrame: Frame = {
  id: 'frame-1',
  name: 'Frame 1',
  windAngle: 0,
  windSpeed: 12,
  boats: [],
  marks: [],
};

const validInput = {
  mode: 'create' as const,
  title: '  Mark Room  ',
  fileName: 'mark-room.json',
  frames: [validFrame],
  existingTemplateIds: ['r10'],
};

describe('template contribution utilities', () => {
  it('creates safe filenames from titles and falls back for blank titles', () => {
    expect(templateFileNameFromTitle('  R18 — Mark-Room!  ')).toBe('r18-mark-room.json');
    expect(templateFileNameFromTitle('Été & Wind')).toBe('ete-wind.json');
    expect(templateFileNameFromTitle('   ')).toBe('template.json');
  });

  it('extracts template ids from filenames', () => {
    expect(templateIdFromFileName('r18.json')).toBe('r18');
    expect(templateIdFromFileName('R18.JSON')).toBe('R18');
    expect(templateIdFromFileName('  custom-template  ')).toBe('custom-template');
  });

  it('parses repository overrides and falls back for malformed values', () => {
    expect(parseTemplateRepository('example/tack-wise', 'develop')).toEqual({
      owner: 'example',
      name: 'tack-wise',
      branch: 'develop',
    });
    expect(parseTemplateRepository('not-a-repository', '')).toEqual({
      ...DEFAULT_TEMPLATE_REPOSITORY,
      branch: 'main',
    });
    expect(parseTemplateRepository(undefined)).toEqual(DEFAULT_TEMPLATE_REPOSITORY);
    expect(parseTemplateRepository('example/tack-wise/extra')).toEqual(DEFAULT_TEMPLATE_REPOSITORY);
    expect(parseTemplateRepository('example/tack wise')).toEqual(DEFAULT_TEMPLATE_REPOSITORY);
  });

  it('builds GitHub create and update editor URLs', () => {
    expect(buildGitHubTemplateEditorUrl('create', 'src/data/situations/new-template.json')).toBe(
      'https://github.com/armandfardeau/tack_wise/new/main?filename=src%2Fdata%2Fsituations%2Fnew-template.json',
    );
    expect(buildGitHubTemplateEditorUrl('update', 'src/data/situations/r18.json', {
      owner: 'example',
      name: 'repo',
      branch: 'develop',
    })).toBe('https://github.com/example/repo/edit/develop/src/data/situations/r18.json');
  });

  it('validates and builds a new template draft without scenario settings', () => {
    expect(validateTemplateContribution(validInput)).toEqual([]);

    const draft = buildTemplateContributionDraft(validInput);
    expect(draft).toMatchObject({
      mode: 'create',
      title: 'Mark Room',
      fileName: 'mark-room.json',
      path: 'src/data/situations/mark-room.json',
      commitMessage: 'Add template: Mark Room',
      pullRequestTitle: 'Add template: Mark Room',
    });
    expect(JSON.parse(draft.content)).toEqual({ title: 'Mark Room', frames: [validFrame] });
    expect(draft.content.endsWith('\n')).toBe(true);
    expect(draft.pullRequestBody).toContain('src/data/situations/mark-room.json');
  });

  it('validates a loaded template update and keeps its filename fixed', () => {
    const input = {
      ...validInput,
      mode: 'update' as const,
      title: 'Updated Mark Room',
      fileName: 'r18.json',
      templateId: 'r18',
      existingTemplateIds: ['r18'],
    };

    expect(validateTemplateContribution(input)).toEqual([]);
    expect(buildTemplateContributionDraft(input).commitMessage).toBe('Update template: Updated Mark Room');
  });

  it('reports duplicate, unsafe, and mismatched template targets', () => {
    expect(validateTemplateContribution({ ...validInput, fileName: 'r10.json' }).map((error) => error.message)).toContain(
      'A template with this filename already exists. Choose another filename or update the existing template.',
    );
    expect(validateTemplateContribution({ ...validInput, fileName: '../unsafe.json' }).map((error) => error.message)).toContain(
      'Use a lowercase kebab-case filename ending in .json.',
    );

    const updateErrors = validateTemplateContribution({
      ...validInput,
      mode: 'update',
      fileName: 'other.json',
      templateId: 'r18',
      existingTemplateIds: ['r18'],
    });
    expect(updateErrors.map((error) => error.message)).toEqual(expect.arrayContaining([
      'The update filename must match the loaded built-in template.',
    ]));

    expect(validateTemplateContribution({
      ...validInput,
      mode: 'update',
      fileName: 'r18.json',
    }).map((error) => error.message)).toContain('Load a built-in template before starting an update pull request.');
  });

  it('reports blank titles and invalid or empty frame data', () => {
    expect(validateTemplateContribution({ ...validInput, title: '   ' }).map((error) => error.message)).toContain('Enter a template title.');
    expect(validateTemplateContribution({ ...validInput, frames: [] }).map((error) => error.message)).toContain('A template must contain at least one frame.');
    expect(validateTemplateContribution({
      ...validInput,
      frames: [{ ...validFrame, boats: [{ id: 'broken' }] } as unknown as Frame],
    }).map((error) => error.message)).toContain('The current diagram contains invalid scenario data.');
    expect(() => buildTemplateContributionDraft({ ...validInput, fileName: 'invalid name.json' })).toThrow('Use a lowercase kebab-case filename');
  });
});

describe('committed situation templates', () => {
  const situationDirectory = join(__dirname, '../src/data/situations');
  const situationFiles = readdirSync(situationDirectory).filter((fileName) => fileName.endsWith('.json'));

  it.each(situationFiles)('contains valid template data in %s', (fileName) => {
    const value = JSON.parse(readFileSync(join(situationDirectory, fileName), 'utf8')) as {
      title?: unknown;
      frames?: Frame[];
    };

    expect(typeof value.title).toBe('string');
    expect(validateTemplateContribution({
      ...validInput,
      title: value.title as string,
      fileName,
      frames: value.frames ?? [],
      existingTemplateIds: [],
    })).toEqual([]);
  });
});
