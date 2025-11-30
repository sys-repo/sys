import { Env } from 'jsr:@sys/fs/env';
import { Obj, Str } from 'jsr:@sys/std';
import { type t } from 'jsr:@sys/tools';

await Env.init(); // ensure deno environment is setup.

export const onDoc: t.DocumentGraphHook = async (e) => {
  const { cmd } = e;
  const current = e.doc.current;

  // 🐷 Hint: perform actions on each document in the graph here.

  if (e.is.root) {
    e.log('hook: root document 👋');
  }
};
