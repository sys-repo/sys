import { Is, Test, type t } from './common.ts';

export const Util = {
  modifiers(e: React.MouseEvent): t.KeyboardModifierFlags {
    return {
      shift: e.shiftKey,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      meta: e.metaKey,
    };
  },

  isSelected(data: t.TestPropListData, spec?: t.TestSuiteModel) {
    if (!spec) return false;
    const selected = (data.specs ?? {}).selected ?? [];
    return selected.includes(spec.hash());
  },

  isSelectable(data: t.TestPropListData) {
    const value = data.specs?.selectable;
    return Boolean(typeof value === 'function' ? value() : value ?? true);
  },

  isAllSelected(data: t.TestPropListData, groups: t.TestSuiteGroup[]) {
    const total = Util.groupsToSuites(groups).length;
    const selected = data.specs?.selected ?? [];
    return selected.length > 0 && selected.length === total;
  },

  isNoneSelected(data: t.TestPropListData) {
    const selected = data.specs?.selected ?? [];
    return selected.length === 0;
  },

  async importAndInitialize(data: t.TestPropListData) {
    const groups = await Util.modulesToGroupedList(data.modules ?? []);
    const res: t.TestSuiteGroup[] = [];

    for (const group of groups) {
      const title = group.title;
      const imported = await Test.import(group.imports, { init: true });
      const suites = imported.map((e) => e.suite);
      res.push({ title, suites });
    }

    return res;
  },

  groupsToSuites(groups: t.TestSuiteGroup[]) {
    return groups.reduce((acc, next) => {
      acc.push(...next.suites);
      return acc;
    }, [] as t.TestSuiteModel[]);
  },

  async modulesToFlatList(input: t.TestPropListModulesInput) {
    const value = typeof input === 'function' ? input() : input;

    let res = Is.promise(value) ? await value : value;
    if (res && !Array.isArray(res)) res = [res];
    res = res?.filter(Boolean);

    return res as t.TestPropListModuleInput[];
  },

  async modulesToGroupedList(input: t.TestPropListModulesInput) {
    type TGroup = { title: string; imports: t.BundleImport[] };

    const list = await Util.modulesToFlatList(input);
    const res: TGroup[] = [];

    list.forEach((item, i) => {
      if (typeof item === 'string' || i === 0) {
        const title = typeof item === 'string' ? item : '';
        res.push({ title, imports: [] });
      }
      if (typeof item === 'object') {
        const last = res[res.length - 1];
        last.imports.push(item);
      }
    });

    return res;
  },
};
