// Copyright 2018-2026 the Deno authors. MIT license.
// Deno-native adapter materially derived from @std/testing@1.0.20/bdd.

import type { Bdd } from './common.ts';

type Callable = {
  (...args: never[]): unknown;
  readonly name: string;
};
type Context = Bdd.Context;
type Hook = Bdd.Hook<Context>;
type HookName = 'beforeAll' | 'beforeEach' | 'afterEach' | 'afterAll';
type Modifier = 'only' | 'ignore' | 'todo' | undefined;
type InputOptions = Record<string, unknown>;
type ParsedSuite = Bdd.DescribeDefinition<Context> & { suite?: SuiteNode };
type ParsedTest = Omit<Bdd.ItDefinition<Context>, 'fn' | 'suite'> & {
  fn?: Bdd.TestBody<Context>;
  suite?: SuiteNode;
};
type TestNode = {
  readonly kind: 'test';
  readonly definition: ParsedTest & { fn: Bdd.TestBody<Context> };
  readonly parent?: SuiteNode;
};
type Node = SuiteNode | TestNode;
type Failure = { readonly thrown: true; readonly value: unknown } | { readonly thrown: false };
type FocusRegistration = { readonly parent: SuiteNode; readonly node: Node };
type RegistrationTransaction = {
  readonly undo: (() => void)[];
  readonly focus: FocusRegistration[];
};

const DESCRIBE_KEYS = new Set([
  'name',
  'fn',
  'suite',
  'ignore',
  'only',
  'permissions',
  'timeout',
  'sanitizeOps',
  'sanitizeResources',
  'sanitizeExit',
  'beforeAll',
  'beforeEach',
  'afterEach',
  'afterAll',
]);
const IT_KEYS = new Set([
  'name',
  'fn',
  'suite',
  'ignore',
  'only',
  'permissions',
  'timeout',
  'sanitizeOps',
  'sanitizeResources',
  'sanitizeExit',
]);
const suites = new Map<symbol, SuiteNode>();
const registrationTransactions: RegistrationTransaction[] = [];
let current: SuiteNode | undefined;
let globalRoot: SuiteNode | undefined;
let hasTopLevelRegistration = false;
let executionStarted = false;

class SuiteNode implements Bdd.TestSuite<Context> {
  readonly symbol = Symbol();
  readonly children: Node[] = [];
  readonly hooks: Record<HookName, Hook[]>;
  readonly definition: ParsedSuite;
  readonly parent?: SuiteNode;
  hasFocusedChild = false;
  registered?: Deno.TestDefinition;
  focusedRegistration = false;

  constructor(definition: ParsedSuite, parent?: SuiteNode) {
    this.definition = definition;
    this.parent = parent;
    this.hooks = {
      beforeAll: toHooks(definition.beforeAll),
      beforeEach: toHooks(definition.beforeEach),
      afterEach: toHooks(definition.afterEach),
      afterAll: toHooks(definition.afterAll),
    };
  }
}

const describeBase = (...args: unknown[]) => registerSuite(args);
const itBase = (...args: unknown[]) => registerTest(args);

export const describe = Object.assign(describeBase, {
  only: (...args: unknown[]) => registerSuite(args, 'only'),
  ignore: (...args: unknown[]) => registerSuite(args, 'ignore'),
  skip: (...args: unknown[]) => registerSuite(args, 'ignore'),
  todo: (...args: unknown[]) => registerSuite(args, 'todo'),
}) as unknown as Bdd.Describe;

export const it = Object.assign(itBase, {
  only: (...args: unknown[]) => registerTest(args, 'only'),
  ignore: (...args: unknown[]) => registerTest(args, 'ignore'),
  skip: (...args: unknown[]) => registerTest(args, 'ignore'),
  todo: (...args: unknown[]) => registerTest(args, 'todo'),
}) as Bdd.It;

export const beforeAll: Bdd.HookRegistration = (fn) => addHook('beforeAll', fn);
export const beforeEach: Bdd.HookRegistration = (fn) => addHook('beforeEach', fn);
export const afterEach: Bdd.HookRegistration = (fn) => addHook('afterEach', fn);
export const afterAll: Bdd.HookRegistration = (fn) => addHook('afterAll', fn);

/**
 * Helpers:
 */
function transactionalRegistration<T>(fn: () => T): T {
  const transaction: RegistrationTransaction = { undo: [], focus: [] };
  registrationTransactions.push(transaction);

  let value: T;
  try {
    value = fn();
  } catch (error) {
    registrationTransactions.pop();
    for (let index = transaction.undo.length - 1; index >= 0; index--) {
      transaction.undo[index]?.();
    }
    throw error;
  }

  registrationTransactions.pop();
  const parent = activeRegistrationTransaction();
  if (parent) {
    parent.undo.push(...transaction.undo);
    parent.focus.push(...transaction.focus);
  } else {
    transaction.focus.forEach(({ parent, node }) => {
      if (isFocused(node)) markFocused(parent);
    });
  }
  return value;
}

function activeRegistrationTransaction(): RegistrationTransaction | undefined {
  return registrationTransactions.at(-1);
}

function retainSuite(suite: SuiteNode): void {
  suites.set(suite.symbol, suite);
  activeRegistrationTransaction()?.undo.push(() => suites.delete(suite.symbol));
}

function registerSuite(args: unknown[], modifier?: Modifier): Bdd.TestSuite<Context> {
  assertRegistrationOpen('test suites');
  const definition = parseSuite(args);
  applyModifier(definition, modifier);
  const parent = definition.suite ?? current;
  const suite = new SuiteNode(definition, parent);

  transactionalRegistration(() => {
    if (!definition.ignore && definition.fn) {
      const previous = current;
      current = suite;
      try {
        const result: unknown = definition.fn();
        if (isThenable(result)) {
          throw new Error(
            'Returning a thenable from "describe" is not supported: tests must be defined synchronously.',
          );
        }
      } finally {
        current = previous;
      }
    }

    retainSuite(suite);
    if (parent) addNode(parent, suite);
  });

  if (!parent) registerTopLevelSuite(suite);
  return { symbol: suite.symbol };
}

function registerTest(args: unknown[], modifier?: Modifier): void {
  assertRegistrationOpen('test cases');
  const definition = parseTest(args);
  applyModifier(definition, modifier);
  if (!definition.fn) {
    if (modifier === 'ignore' || modifier === 'todo') {
      definition.fn = () => undefined;
    } else {
      throw new TypeError('A test body is required.');
    }
  }

  const parent = definition.suite ?? current;
  const test: TestNode = { kind: 'test', definition: definition as TestNode['definition'], parent };
  if (parent) addNode(parent, test);
  else registerTopLevelTest(test);
}

function addHook<T>(name: HookName, fn: Bdd.Hook<T>): void {
  assertRegistrationOpen('hooks');
  if (typeof fn !== 'function') throw new TypeError(`${name} requires a hook function.`);
  const hook = fn as Hook;

  if (current) {
    if (current === globalRoot && current.children.length > 0) {
      throw new Error('Cannot add global hooks after a global test or suite is registered.');
    }
    current.hooks[name].push(hook);
    return;
  }

  if (hasTopLevelRegistration) {
    throw new Error('Cannot add global hooks after a global test or suite is registered.');
  }

  const definition: ParsedSuite = { name: 'global' };
  const root = new SuiteNode(definition);
  root.hooks[name].push(hook);
  retainSuite(root);
  globalRoot = root;
  current = root;
  registerTopLevelSuite(root);
}

function registerTopLevelSuite(suite: SuiteNode): void {
  const definition = createTopLevelSuiteDefinition(suite);
  if (suite.hasFocusedChild) definition.only = true;
  suite.registered = definition;
  hasTopLevelRegistration = true;
  Deno.test(definition);
  suite.focusedRegistration = definition.only === true;
}

/**
 * Deno snapshots test definitions at registration. A suite handle can receive a focused descendant
 * later during the same module evaluation, so register one focused proxy and let Deno filter the
 * original non-focused registration.
 */
function registerFocusedTopLevelSuite(suite: SuiteNode): void {
  if (suite.focusedRegistration) return;
  const definition = createTopLevelSuiteDefinition(suite);
  definition.only = true;
  Deno.test(definition);
  suite.focusedRegistration = true;
}

function createTopLevelSuiteDefinition(suite: SuiteNode): Deno.TestDefinition {
  return toDenoDefinition(suite.definition, async (context) => {
    executionStarted = true;
    await runSuite(suite, {}, context, [suite]);
  });
}

function registerTopLevelTest(test: TestNode): void {
  const definition = toDenoDefinition(test.definition, async (context) => {
    executionStarted = true;
    await test.definition.fn.call({}, context);
  });
  hasTopLevelRegistration = true;
  Deno.test(definition);
}

function addNode(parent: SuiteNode, node: Node): void {
  parent.children.push(node);
  const transaction = activeRegistrationTransaction();
  if (transaction) {
    transaction.undo.push(() => {
      const index = parent.children.indexOf(node);
      if (index >= 0) parent.children.splice(index, 1);
    });
    transaction.focus.push({ parent, node });
  } else if (isFocused(node)) {
    markFocused(parent);
  }
}

function markFocused(suite: SuiteNode): void {
  let cursor: SuiteNode | undefined = suite;
  while (cursor) {
    if (cursor.definition.ignore === true) return;
    cursor.hasFocusedChild = true;
    if (!cursor.parent && cursor.registered) registerFocusedTopLevelSuite(cursor);
    cursor = cursor.parent;
  }
}

async function runSuite(
  suite: SuiteNode,
  context: Context,
  denoContext: Deno.TestContext,
  ancestors: SuiteNode[],
): Promise<void> {
  await withTeardown(
    async () => {
      await runHooks(suite.hooks.beforeAll, context);
      for (const child of suite.children) {
        if (suite.hasFocusedChild && !isFocused(child)) continue;
        await runStep(child, context, denoContext, ancestors);
      }
    },
    suite.hooks.afterAll,
    context,
  );
}

async function runStep(
  node: Node,
  parentContext: Context,
  denoContext: Deno.TestContext,
  ancestors: SuiteNode[],
): Promise<void> {
  const definition = toDenoStepDefinition(node, async (stepContext) => {
    assertNestedPolicy(node);
    if (node instanceof SuiteNode) {
      const context = { ...parentContext };
      await runSuite(node, context, stepContext, [...ancestors, node]);
    } else {
      const context = { ...parentContext };
      await runLeaf(node, context, stepContext, ancestors, 0);
    }
  });
  await denoContext.step(definition);
}

async function runLeaf(
  test: TestNode,
  context: Context,
  denoContext: Deno.TestContext,
  ancestors: SuiteNode[],
  offset: number,
): Promise<void> {
  const suite = ancestors[offset];
  if (!suite) {
    await test.definition.fn.call(context, denoContext);
    return;
  }

  await withTeardown(
    async () => {
      await runHooks(suite.hooks.beforeEach, context);
      await runLeaf(test, context, denoContext, ancestors, offset + 1);
    },
    suite.hooks.afterEach,
    context,
  );
}

async function runHooks(hooks: Hook[], context: Context): Promise<void> {
  for (const hook of hooks) await hook.call(context);
}

async function withTeardown(
  body: () => void | Promise<void>,
  teardown: Hook[],
  context: Context,
): Promise<void> {
  let primary: Failure = { thrown: false };
  try {
    await body();
  } catch (error) {
    primary = { thrown: true, value: error };
  }

  const teardownErrors: unknown[] = [];
  for (const hook of teardown) {
    try {
      await hook.call(context);
    } catch (error) {
      teardownErrors.push(error);
    }
  }

  if (primary.thrown && teardownErrors.length > 0) {
    throw new AggregateError(
      [primary.value, ...teardownErrors],
      'BDD execution and teardown both failed.',
    );
  }
  if (primary.thrown) throw primary.value;
  if (teardownErrors.length === 1) throw teardownErrors[0];
  if (teardownErrors.length > 1) {
    throw new AggregateError(teardownErrors, 'Multiple BDD teardown hooks failed.');
  }
}

function toDenoDefinition(
  input: Bdd.TestOptions & { name: string },
  fn: (context: Deno.TestContext) => void | Promise<void>,
): Deno.TestDefinition {
  const output: Deno.TestDefinition = { name: input.name, fn };
  copyTopLevelPolicy(input, output);
  return output;
}

function toDenoStepDefinition(
  node: Node,
  fn: (context: Deno.TestContext) => void | Promise<void>,
): Deno.TestStepDefinition {
  const input = node.definition;
  const output: Deno.TestStepDefinition = { name: input.name, fn };
  if (input.ignore !== undefined) output.ignore = input.ignore;
  if (input.sanitizeOps !== undefined) output.sanitizeOps = input.sanitizeOps;
  if (input.sanitizeResources !== undefined) {
    output.sanitizeResources = input.sanitizeResources;
  }
  if (input.sanitizeExit !== undefined) output.sanitizeExit = input.sanitizeExit;
  return output;
}

function copyTopLevelPolicy(input: Bdd.TestOptions, output: Deno.TestDefinition): void {
  if (input.ignore !== undefined) output.ignore = input.ignore;
  if (input.only !== undefined) output.only = input.only;
  if (input.permissions !== undefined) output.permissions = input.permissions;
  if (input.timeout !== undefined) output.timeout = input.timeout;
  if (input.sanitizeOps !== undefined) output.sanitizeOps = input.sanitizeOps;
  if (input.sanitizeResources !== undefined) {
    output.sanitizeResources = input.sanitizeResources;
  }
  if (input.sanitizeExit !== undefined) output.sanitizeExit = input.sanitizeExit;
}

function assertNestedPolicy(node: Node): void {
  const unsupported: string[] = [];
  if (node.definition.permissions !== undefined) unsupported.push('permissions');
  if (node.definition.timeout !== undefined) unsupported.push('timeout');
  if (unsupported.length === 0) return;
  throw new Error(
    `Nested test "${node.definition.name}" does not support ${
      unsupported.join(' or ')
    }; Deno.TestContext.step cannot enforce it.`,
  );
}

function parseSuite(args: unknown[]): ParsedSuite {
  const parsed = parseArgs(args, DESCRIBE_KEYS, 'suite');
  const definition: ParsedSuite = {
    name: parsed.name,
    fn: parsed.fn as Bdd.DescribeBody | undefined,
    suite: parsed.suite,
  };
  copyParsedPolicy(parsed.options, definition);
  definition.beforeAll = readHooks(parsed.options.beforeAll, 'beforeAll');
  definition.beforeEach = readHooks(parsed.options.beforeEach, 'beforeEach');
  definition.afterEach = readHooks(parsed.options.afterEach, 'afterEach');
  definition.afterAll = readHooks(parsed.options.afterAll, 'afterAll');
  return definition;
}

function parseTest(args: unknown[]): ParsedTest {
  const parsed = parseArgs(args, IT_KEYS, 'test');
  const definition: ParsedTest = {
    name: parsed.name,
    fn: parsed.fn as Bdd.TestBody<Context> | undefined,
    suite: parsed.suite,
  };
  copyParsedPolicy(parsed.options, definition);
  return definition;
}

function parseArgs(
  args: unknown[],
  allowed: Set<string>,
  kind: 'suite' | 'test',
): { name: string; fn?: Callable; suite?: SuiteNode; options: InputOptions } {
  if (args.length === 0 || args.length > 4) {
    throw new TypeError(`Invalid ${kind} registration arguments.`);
  }

  const values = [...args];
  let suite = readSuite(values[0]);
  if (suite) values.shift();
  if (values.length === 0 || values.length > 3) {
    throw new TypeError(`Invalid ${kind} registration arguments.`);
  }

  const first = values[0];
  const second = values[1];
  const third = values[2];
  let name: string | undefined;
  let fn: Callable | undefined;
  let options: InputOptions = {};

  if (typeof first === 'string') {
    name = first;
    if (typeof second === 'function') {
      fn = second as Callable;
      if (third !== undefined) throw new TypeError(`Invalid ${kind} registration arguments.`);
    } else if (second !== undefined) {
      options = readOptions(second, allowed, kind);
      if (third !== undefined) {
        if (typeof third !== 'function') {
          throw new TypeError(`Invalid ${kind} registration arguments.`);
        }
        fn = third as Callable;
      }
    }
  } else if (typeof first === 'function') {
    fn = first as Callable;
    name = first.name;
    if (second !== undefined) throw new TypeError(`Invalid ${kind} registration arguments.`);
  } else {
    options = readOptions(first, allowed, kind);
    if (second !== undefined) {
      if (typeof second !== 'function' || third !== undefined) {
        throw new TypeError(`Invalid ${kind} registration arguments.`);
      }
      fn = second as Callable;
    }
  }

  const optionsSuite = options.suite === undefined ? undefined : requireSuite(options.suite);
  if (suite && optionsSuite) throw new TypeError(`A ${kind} suite was supplied more than once.`);
  suite ??= optionsSuite;
  if (name === undefined && typeof options.name === 'string') name = options.name;
  if (fn === undefined && typeof options.fn === 'function') fn = options.fn as Callable;
  name ??= fn?.name ?? '';
  if (typeof name !== 'string') throw new TypeError(`A ${kind} name must be a string.`);
  return { name, fn, suite, options };
}

function readOptions(value: unknown, allowed: Set<string>, kind: string): InputOptions {
  if (!isObject(value) || Array.isArray(value)) {
    throw new TypeError(`Invalid ${kind} options.`);
  }
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new TypeError(`Unknown ${kind} option: ${key}.`);
  }
  validateOptionTypes(value, kind);
  return { ...value };
}

function validateOptionTypes(options: InputOptions, kind: string): void {
  const booleans = ['ignore', 'only', 'sanitizeOps', 'sanitizeResources', 'sanitizeExit'];
  for (const key of booleans) {
    const value = options[key];
    if (value !== undefined && typeof value !== 'boolean') {
      throw new TypeError(`${kind} option ${key} must be a boolean.`);
    }
  }
  if (options.name !== undefined && typeof options.name !== 'string') {
    throw new TypeError(`${kind} option name must be a string.`);
  }
  if (options.fn !== undefined && typeof options.fn !== 'function') {
    throw new TypeError(`${kind} option fn must be a function.`);
  }
  if (options.timeout !== undefined && typeof options.timeout !== 'number') {
    throw new TypeError(`${kind} option timeout must be a number.`);
  }
}

function copyParsedPolicy(options: InputOptions, output: Bdd.TestOptions): void {
  if (options.ignore !== undefined) output.ignore = options.ignore as boolean;
  if (options.only !== undefined) output.only = options.only as boolean;
  if (options.permissions !== undefined) {
    output.permissions = options.permissions as Deno.PermissionOptions;
  }
  if (options.timeout !== undefined) output.timeout = options.timeout as number;
  if (options.sanitizeOps !== undefined) output.sanitizeOps = options.sanitizeOps as boolean;
  if (options.sanitizeResources !== undefined) {
    output.sanitizeResources = options.sanitizeResources as boolean;
  }
  if (options.sanitizeExit !== undefined) output.sanitizeExit = options.sanitizeExit as boolean;
}

function applyModifier(
  definition: { name: string; ignore?: boolean; only?: boolean },
  modifier?: Modifier,
): void {
  if (modifier === 'only') definition.only = true;
  if (modifier === 'ignore') definition.ignore = true;
  if (modifier === 'todo') {
    definition.ignore = true;
    definition.name = `[todo] ${definition.name}`.trimEnd();
  }
  if (definition.ignore === true) definition.only = false;
}

function readHooks(value: unknown, name: HookName): Hook | Hook[] | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'function') return value as Hook;
  if (Array.isArray(value) && value.every((item) => typeof item === 'function')) {
    return value as Hook[];
  }
  throw new TypeError(`${name} must be a hook function or array of hook functions.`);
}

function toHooks(input?: Hook | Hook[]): Hook[] {
  if (input === undefined) return [];
  return typeof input === 'function' ? [input] : [...input];
}

function readSuite(value: unknown): SuiteNode | undefined {
  if (!isObject(value) || typeof value.symbol !== 'symbol') return undefined;
  return requireSuite(value);
}

function requireSuite(value: unknown): SuiteNode {
  if (!isObject(value) || typeof value.symbol !== 'symbol') {
    throw new TypeError('Suite does not represent a registered test suite.');
  }
  const suite = suites.get(value.symbol);
  if (!suite) throw new TypeError('Suite does not represent a registered test suite.');
  return suite;
}

function isFocused(node: Node): boolean {
  if (node.definition.ignore === true) return false;
  return node.definition.only === true || (node instanceof SuiteNode && node.hasFocusedChild);
}

function isObject(value: unknown): value is InputOptions {
  return typeof value === 'object' && value !== null;
}

function isThenable(value: unknown): boolean {
  if ((typeof value !== 'object' || value === null) && typeof value !== 'function') return false;
  return typeof (value as { then?: unknown }).then === 'function';
}

function assertRegistrationOpen(subject: string): void {
  if (executionStarted) {
    throw new Error(`Cannot register new ${subject} after registered tests start running.`);
  }
}
