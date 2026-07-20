import type { Frame, ScenarioExportPayload } from '../types';

export interface SituationTemplate {
  id: string;
  title: string;
  frames: Frame[];
}

interface SituationFile {
  title: string;
  frames: Frame[];
}

const situationModules = import.meta.glob<SituationFile>('./situations/*.json', {
  eager: true,
  import: 'default',
});

function templateIdFromPath(path: string) {
  return path.split('/').pop()?.replace(/\.json$/, '') ?? path;
}

export const situationTemplates: SituationTemplate[] = Object.entries(situationModules)
  .map(([path, situation]) => ({
    id: templateIdFromPath(path),
    title: situation.title,
    frames: situation.frames,
  }))
  .sort((first, second) => first.title.localeCompare(second.title));

export function scenarioPayloadFromTemplate(template: SituationTemplate): ScenarioExportPayload {
  return {
    version: 2,
    frames: template.frames,
    currentFrameIndex: 0,
    settings: {
      title: template.title,
      displayMode: 'single',
      presenterMode: false,
      showFrameTitle: true,
      showFrameNumber: true,
    },
  };
}
