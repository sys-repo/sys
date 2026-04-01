import { HttpProxy } from '@sys/http/server';
import { Routes } from './m.proxy.routes.ts';

export const proxy = HttpProxy.create({ config: Routes.proxy });
