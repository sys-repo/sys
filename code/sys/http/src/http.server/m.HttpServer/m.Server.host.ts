import { Hono } from 'hono';
import type { t } from './common.host.ts';

/** Create one bare HTTP application without static-file or CORS authority. */
export const create: () => t.HttpServer.App = () => new Hono();
