import type { t } from './common.ts';
import { plan } from './u.plan.ts';
import { resources } from './u.resources.ts';
import { start } from './u.start.ts';
import { verify } from './u.verify.ts';
import { wait } from './u.wait.ts';

export const CellServices: t.Cell.Services.Lib = { plan, verify, resources, start, wait };
