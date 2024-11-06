import type { t } from './common.ts';
import { fields } from '../PropList/u.fields.ts';

type ClickArgs<F extends string = string> = t.PropListFieldSelectorClickHandlerArgs<F>;

export const Wrangle = {
  fields,

  isSubfield(all: string[], field: string) {
    if (!field.includes('.')) return false;
    const prefix = field.substring(0, field.lastIndexOf('.'));
    return all.includes(prefix);
  },

  next(all: string[], selected: string[], field: string, modifiers: t.KeyboardModifierFlags) {
    type A = t.PropListFieldSelectorAction;
    const action: A = selected.includes(field) ? 'Deselect' : 'Select';
    let next = action === 'Select' ? [...selected, field] : selected.filter((f) => f !== field);
    if (modifiers.meta) {
      if (action === 'Select') next = Wrangle.addSubfields(all, next, field);
      if (action === 'Deselect') next = Wrangle.removeSubfields(all, next, field);
    }
    return { action, prev: [...selected], next } as const;
  },

  subfields(all: string[], field: string) {
    const match = `${field}.`;
    return all.filter((field) => field.startsWith(match));
  },

  addSubfields(all: string[], selected: string[], field: string) {
    const subfields = Wrangle.subfields(all, field);
    selected = selected.filter((f) => !subfields.includes(f));
    const index = selected.indexOf(field);
    selected.splice(index < 0 ? selected.length : index + 1, 0, ...subfields);
    return selected;
  },

  removeSubfields(all: string[], selected: string[], field: string) {
    const subfields = Wrangle.subfields(all, field);
    return selected.filter((f) => !subfields.includes(f));
  },

  clickArgs<F extends string = string>(args: {
    action: t.PropListFieldSelectorAction;
    field?: F;
    prev?: F[];
    next?: F[];
  }): ClickArgs {
    const { action, field } = args;
    const value = {
      prev: args.prev ? [...args.prev] : undefined,
      next: args.next ? [...args.next] : undefined,
    };
    const payload: ClickArgs = {
      action,
      field,
      value,
      next<T extends string>(defaults?: (T | undefined | null)[]) {
        if (action === 'Reset:Clear') return [];
        if (action === 'Reset:Default') return fields(defaults);
        return value.next as unknown as T[];
      },
      as<T extends string>() {
        return payload as ClickArgs<T>;
      },
    };
    return payload;
  },
} as const;
