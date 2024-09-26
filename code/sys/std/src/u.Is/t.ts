import type { t } from '../common.ts';

export type CommonIsLib = {
  subject: t.RxIs['subject'];
  observable: t.RxIs['observable'];
  promise<T = any>(value?: any): value is Promise<T>;
};
