import { PiFs } from '../../u.fs.ts';
import { Fs, Is, JsonFile, Obj, type t, Time } from '../common.ts';

type MenuStateDocument = t.PiCliProfiles.MenuState.Document;
type StartMode = t.PiCliProfiles.StartMode;

const MENU_STATE = {
  file: 'menu.json' as const,
  defaultMode: 'cli' as const,
  schemaVersion: 1 as t.PiCliProfiles.MenuState.SchemaVersion,
  expectedKeys: ['selectedMode', '.meta'] as const,
} as const;
const MENU_STATE_KEY_SET = new Set<string>(MENU_STATE.expectedKeys);

/**
 * Launcher-owned interactive menu preference persistence.
 */
export const MenuState = {
  pathOf(root: t.StringDir) {
    return Fs.join(root, PiFs.stateDir, MENU_STATE.file) as t.StringPath;
  },

  async readMode(root: t.StringDir): Promise<StartMode> {
    try {
      const state = await readState(root);
      if (!state) return MENU_STATE.defaultMode;
      return state;
    } catch {
      return MENU_STATE.defaultMode;
    }
  },

  async writeMode(input: { root: t.StringDir; selectedMode: StartMode }) {
    const path = MenuState.pathOf(input.root);
    const seed = seedDoc(input.selectedMode);

    try {
      const file = await writeSafeModeFile(path, seed);
      file.change((doc) => {
        const next = doc as t.DeepMutable<MenuStateDocument>;
        next.selectedMode = input.selectedMode;
        next['.meta'].schemaVersion = MENU_STATE.schemaVersion;
      });
      const { error } = await file.fs.save();
      return !error;
    } catch {
      return false;
    }
  },
} as const;

/**
 * Helpers:
 */
async function readState(root: t.StringDir): Promise<StartMode | undefined> {
  const path = MenuState.pathOf(root);
  const read = await Fs.readJson<unknown>(path);
  if (!read.ok || !Obj.isRecord(read.data)) return undefined;

  if (!isCurrent(read.data)) return undefined;
  return read.data['selectedMode'];
}

async function writeSafeModeFile(path: t.StringPath, seed: MenuStateDocument) {
  const existing = await Fs.readJson<unknown>(path);
  const useExisting = existing.ok && isCurrent(existing.data);

  if (!useExisting) {
    await Fs.remove(path);
    return JsonFile.get<MenuStateDocument>(path, seed);
  }

  return JsonFile.get<MenuStateDocument>(path, seed);
}

function isCurrent(data: unknown): data is t.PiCliProfiles.MenuState {
  if (!Obj.isRecord(data)) return false;
  if (!isExactShape(data)) return false;
  if (!isStartMode(data['selectedMode'])) return false;
  if (!Obj.isRecord(data['.meta'])) return false;

  const meta = data['.meta'];
  return Is.number(meta.createdAt) &&
    Is.number(meta.schemaVersion) &&
    meta.schemaVersion === MENU_STATE.schemaVersion;
}

function isExactShape(data: Record<string, unknown>): boolean {
  const keys = Object.keys(data);
  if (keys.length !== MENU_STATE.expectedKeys.length) return false;
  return keys.every((key) => MENU_STATE_KEY_SET.has(key));
}

function isStartMode(value: unknown): value is StartMode {
  return value === 'cli' || value === 'ui';
}

function seedDoc(selectedMode: StartMode): MenuStateDocument {
  return {
    '.meta': {
      createdAt: Time.now.timestamp,
      schemaVersion: MENU_STATE.schemaVersion,
    },
    selectedMode,
  };
}
