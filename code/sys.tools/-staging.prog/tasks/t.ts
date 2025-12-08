import type { t } from '../common.ts';

/**
 * A single task entry
 */
export type Task = {
  TODO: string;
  comment?: string;
};

export type DocTasks = {
  doc: { id: t.Crdt.Id };
  tasks: Task[];
};
