import { DEFAULTS, R, type t } from './common.ts';

export const Wrangle = {
  url() {
    const url = new URL(globalThis.location.href);
    const params = url.searchParams;
    const filter = params.get(DEFAULTS.qs.filter) ?? '';
    const selected = params.get(DEFAULTS.qs.selected) ?? '';
    return { url, params, filter, selected };
  },

  selected(imports: t.ModuleImports | undefined, next: number) {
    if (!imports) return -1;
    const total = Object.keys(imports).length - 1;
    return total >= 0 ? R.clamp(0, total, next) : -1;
  },

  selectedIndexFromUri(imports?: t.ModuleImports | undefined, uri?: string) {
    if (!imports || !uri || uri === 'true') return -1;
    const index = Object.keys(imports).indexOf(uri);
    return Wrangle.selected(imports, index);
  },

  selectedUriFromIndex(imports?: t.ModuleImports | undefined, index?: number) {
    if (!imports || index === undefined) return undefined;
    return Object.keys(imports ?? {})[index];
  },

  hintKey(args: { focused: boolean; command: string }) {
    if (!args.focused) return ['↑', '↓', '⌘K'];
    return ['↑', '↓', 'enter'];
  },

  filteredImports(props: Pick<t.CmdHostStatefulProps, 'filter' | 'imports' | 'command'>) {
    const { filter = DEFAULTS.filter, imports = {}, command } = props;
    if (!imports || filter === null) return imports;
    return filter(imports, command);
  },
} as const;
