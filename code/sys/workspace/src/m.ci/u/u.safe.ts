import { Is, Json } from '../common.ts';

const SAFE_WORKFLOW_SCALAR = /^\/?[A-Za-z0-9@._/-]+$/;

/**
 * Fail closed before rendering repo-discovered values into generated workflow YAML.
 */
export const WorkflowSafe = {
  scalar(value: string, label: string) {
    if (!Is.str(value) || !value.trim()) throw unsafe(label, value);
    if (value.includes('..')) throw unsafe(label, value);
    if (!SAFE_WORKFLOW_SCALAR.test(value)) throw unsafe(label, value);
    return value;
  },
} as const;

function unsafe(label: string, value: string) {
  return new Error(`Unsafe workflow ${label}: ${Json.stringify(value)}`);
}
