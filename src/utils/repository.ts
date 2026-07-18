import type { ScenarioExportPayload, ScenarioRepositoryItem } from '../types';

const REPOSITORY_KEY = 'tack-wise-scenario-library';

export interface ScenarioRepository {
  list(): ScenarioRepositoryItem[];
  save(title: string, payload: ScenarioExportPayload): ScenarioRepositoryItem;
  load(id: string): ScenarioRepositoryItem | undefined;
  remove(id: string): void;
}

function readItems(): ScenarioRepositoryItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(REPOSITORY_KEY);
    if (!raw) return [];
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value) ? value as ScenarioRepositoryItem[] : [];
  } catch {
    return [];
  }
}

function writeItems(items: ScenarioRepositoryItem[]) {
  window.localStorage.setItem(REPOSITORY_KEY, JSON.stringify(items));
}

export function listScenarioRepositoryItems() {
  return readItems().sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function saveScenarioRepositoryItem(title: string, payload: ScenarioExportPayload) {
  const items = readItems();
  const item: ScenarioRepositoryItem = {
    id: `scenario-${Date.now()}`,
    title: title.trim() || 'Untitled situation',
    updatedAt: new Date().toISOString(),
    payload,
  };
  writeItems([item, ...items]);
  return item;
}

export function loadScenarioRepositoryItem(id: string) {
  return readItems().find((item) => item.id === id);
}

export function deleteScenarioRepositoryItem(id: string) {
  writeItems(readItems().filter((item) => item.id !== id));
}

export const localScenarioRepository: ScenarioRepository = {
  list: listScenarioRepositoryItems,
  save: saveScenarioRepositoryItem,
  load: loadScenarioRepositoryItem,
  remove: deleteScenarioRepositoryItem,
};
