import { type t } from './common.ts';

export function createContext(args: {
  rules: t.CssDomRules;
  kind: t.CssDomContextBlock['kind'];
}): t.CssDomContextBlock {
  const { rules, kind } = args;

  const api: t.CssDomContextBlock = {
    kind,
  };

  return api;
}
