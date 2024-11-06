import { isValidElement } from 'react';
import type { t } from './common.ts';

export function format(item: t.PropListItem) {
  const { tooltip, visible } = item;
  let _label: t.PropListLabel | undefined;
  let _value: t.PropListValue | undefined;

  const res = {
    tooltip,
    visible,

    get label(): t.PropListLabel {
      if (_label === undefined) {
        if (typeof item.label !== 'object') _label = { body: item.label };
        else if (isValidElement(item.label)) _label = { body: item.label as JSX.Element };
        else _label = item.label as t.PropListLabel;
      }
      return _label;
    },

    get value(): t.PropListValue {
      if (_value === undefined) {
        if (typeof item.value !== 'object') _value = { body: item.value };
        else if (isValidElement(item.value)) _value = { body: item.value as JSX.Element };
        else _value = item.value as t.PropListValue;
      }
      return _value;
    },

    get isString() {
      return typeof res.value.body === 'string';
    },

    get isNumber() {
      return typeof res.value.body === 'number';
    },

    get isBoolean() {
      return typeof res.value.body === 'boolean';
    },

    get isComponent() {
      return isValidElement(res.value.body);
    },

    get isSimple() {
      return res.isString || res.isNumber || res.isBoolean;
    },

    get isItemClickable() {
      return !!item.onClick;
    },

    get isValueClickable() {
      return !!(item.onClick || res.value.onClick);
    },

    get isLabelClickable() {
      return !!(item.onClick || res.label.onClick);
    },
  } as const;

  return res;
}
