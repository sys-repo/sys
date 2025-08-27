import { type t } from './common.ts';

/**
 * Example UI composition plan (canonical).
 */
export const plan = {
  root: {
    component: 'ui.Hello',
    props: { title: 'Hello' },
    // slots: { } // add named slots later if/when you declare them
  },
} satisfies t.Plan;
