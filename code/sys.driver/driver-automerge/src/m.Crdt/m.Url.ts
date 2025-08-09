import { type t } from './common.ts';

export const CrdtUrl: t.CrdtUrlLib = {
  ws(input) {
    const host = (input ?? '').trim().replace(/^wss?:\/\//, '');
    const protocol = host.startsWith('localhost') ? 'ws' : 'wss';
    return host ? `${protocol}://${host}` : '';
  },
};
