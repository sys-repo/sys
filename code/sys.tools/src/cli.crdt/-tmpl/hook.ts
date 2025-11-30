import { Env } from 'jsr:@sys/fs/env';
import { Obj, Str } from 'jsr:@sys/std';
import { type t } from 'jsr:@sys/tools';

await Env.init({ silent: true }); // ensure deno environment is setup on first run.

export const onDoc: t.DocumentGraphHook = async (e) => {
  const { cmd } = e;
  const current = e.doc.current;

  // 🐷 Hint: perform your actions on each document in the graph here.

  if (e.is.root) {
    e.log('hook: root document 👋');
  }
};
