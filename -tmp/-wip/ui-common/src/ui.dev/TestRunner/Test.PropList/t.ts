import type { t } from '../../../common.ts';

type HashString = string;
type Ctx = Record<string, unknown>;
type LazyString = string | (() => string | undefined);
type LazyBool = boolean | (() => boolean | undefined);

export type TestPropListModuleInput = t.BundleImport | string;
export type TestPropListModulesInput =
  | TestPropListModuleInput[]
  | (() => TestPropListModuleInput[] | Promise<TestPropListModuleInput[]>);

export type TestRunnerField =
  | 'Module'
  | 'Module.Version'
  | 'Tests.Run'
  | 'Tests.Selector'
  | 'Tests.Selector.Reset';

export type TestSuiteGroup = { title: string; suites: t.TestSuiteModel[] };

/**
 * Data model for the <TestRunner.PropList> component.
 */
export type TestPropListData = {
  pkg?: t.Pkg;
  modules?: TestPropListModulesInput;
  run?: TestPropListRunData;
  specs?: TestPropListSpecsData;
  keyboard?: TestPropListKeyboard;
};

export type TestPropListRunData = {
  ctx?: Ctx | (() => Ctx);
  infoUrl?: LazyString;
  label?: LazyString;
  button?: 'visible' | 'hidden';
  onRunSingle?: SpecRunClickHandler;
  onRunAll?: SpecRunAllClickHandler;
};

export type TestPropListKeyboardPattern = LazyString; // eg. "CMD + Enter"
export type TestPropListKeyboard = {
  run?: TestPropListKeyboardPattern; //    Run selected.
  runAll?: TestPropListKeyboardPattern; // Force run all.
  selectAllToggle?: TestPropListKeyboardPattern;
  selectAll?: TestPropListKeyboardPattern;
  selectNone?: TestPropListKeyboardPattern;
};

export type TestPropListSpecsData = {
  selected?: HashString[];
  selectable?: LazyBool;
  ellipsis?: LazyBool;
  results?: { [key: HashString]: true | t.TestSuiteRunResponse };
  onSelect?: SpecsSelectionHandler;
  onReset?: SpecsSelectionResetHandler;
};

/**
 * Event handlers.
 */
export type SpecsSelectionHandler = (e: SpecsSelectionHandlerArgs) => void;
export type SpecsSelectionHandlerArgs = {
  suite: t.TestSuiteModel;
  from: boolean;
  to: boolean;
  modifiers: t.KeyboardModifierFlags;
};

export type SpecsSelectionResetHandler = (e: SpecsSelectionResetHandlerArgs) => void;
export type SpecsSelectionResetHandlerArgs = {
  modifiers: t.KeyboardModifierFlags;
  select?: 'all' | 'none';
};

export type SpecRunClickHandler = (e: SpecRunClickHandlerArgs) => void | Promise<void>;
export type SpecRunClickHandlerArgs = {
  suite: t.TestSuiteModel;
  modifiers: t.KeyboardModifierFlags;
};

export type SpecRunAllClickHandler = (e: SpecRunAllClickHandlerArgs) => void | Promise<void>;
export type SpecRunAllClickHandlerArgs = {
  modifiers: t.KeyboardModifierFlags;
};

/**
 * Observable.
 */
export type TestPropListChangeHandler = (e: t.TestPropListChange) => void;
export type TestPropListChange = {
  op:
    | 'selection'
    | 'reset'
    | 'run:all:start'
    | 'run:single:start'
    | 'run:single:complete'
    | 'run:all:complete';
  selected: HashString[];
  results: t.TestSuiteRunResponse[];
};
