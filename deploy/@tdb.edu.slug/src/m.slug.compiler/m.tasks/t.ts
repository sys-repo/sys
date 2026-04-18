import type { t } from '../common.ts';

/**
 * Tasks namespace
 */
export type TasksLib = {
  find(dag: t.Graph.Dag.Result, yamlPath: t.ObjectPath): Promise<TasksResponse>;
};

/** Aggregate task summary across a slug graph. */
export type TasksResponse = { total: { docs: number }; docs: t.DocTasks[]; toString(): string };

/**
 * A single task entry
 */
export type Task = {
  TODO: string;
  comment?: string;
};

/** Task summary for a single document. */
export type DocTasks = {
  doc: { id: t.Crdt.Id };
  tasks: Task[];
};
