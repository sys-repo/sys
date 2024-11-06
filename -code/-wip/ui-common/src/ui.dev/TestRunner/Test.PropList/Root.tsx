import { TestPropListControlled } from './Root.Controlled';
import { Item } from './Root.Item';
import { DEFAULTS, FC } from './common';
import { useController } from './hooks/useController';
import { TestPropListController as controller } from './logic/Controller';
import { PropList as View, type TestPropListProps } from './ui/PropList';
import { PropListFieldSelector as FieldSelector } from './ui/PropList.FieldSelector';

export type { TestPropListProps };

/**
 * Export
 */
type Fields = {
  DEFAULTS: typeof DEFAULTS;
  FieldSelector: typeof FieldSelector;
  Controlled: typeof TestPropListControlled;
  controller: typeof controller;
  useController: typeof useController;
  runner: typeof Item.runner;
};

export const TestPropList = FC.decorate<TestPropListProps, Fields>(
  View,
  {
    DEFAULTS,
    FieldSelector,
    Controlled: TestPropListControlled,
    controller,
    useController,
    runner: Item.runner,
  },
  { displayName: DEFAULTS.displayName.TestPropList },
);
