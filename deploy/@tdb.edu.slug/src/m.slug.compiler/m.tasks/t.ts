import type { t } from '../common.ts';

/**
 * Tasks namespace
 */
export type TasksLib = {
  find(dag: t.Graph.Dag.Result, yamlPath: t.ObjectPath): Promise<TasksResponse>;
};

export type TasksResponse = { total: { docs: number }; docs: t.DocTasks[]; toString(): string };

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
