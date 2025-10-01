import { type t } from './common.ts';
import { guard } from './u.guard.ts';
import { make } from './u.make.ts';
import { makeUseLease } from './use.Lease.ts';

export const Lease: t.LeaseLib = {
  makeUseLease,
  make,
  guard,
};
