export declare namespace Bdd {
  /** BDD registration surface. */
  export type Lib = {
    readonly describe: Describe;
    readonly it: It;
    readonly beforeAll: HookRegistration;
    readonly beforeEach: HookRegistration;
    readonly afterEach: HookRegistration;
    readonly afterAll: HookRegistration;
  };

  /** Context shared by a suite's hooks and copied for descendant suites and tests. */
  export type Context = Record<string, unknown>;

  /** A synchronous suite-registration body. */
  export type DescribeBody = () => void | undefined;

  /** A test body executed by Deno. */
  export type TestBody<T = Context> = (this: T, context: Deno.TestContext) => void | Promise<void>;

  /** A suite hook executed with the suite or leaf-test context. */
  export type Hook<T = Context> = (this: T) => void | Promise<void>;

  /** Opaque handle returned by `describe`. */
  export type TestSuite<T = Context> = {
    readonly symbol: symbol;
  };

  /** Deno policy available to top-level tests. */
  export type TestOptions = {
    ignore?: boolean;
    only?: boolean;
    permissions?: Deno.PermissionOptions;
    timeout?: number;
    sanitizeOps?: boolean;
    sanitizeResources?: boolean;
    sanitizeExit?: boolean;
  };

  /** Deno policy available to nested test steps. */
  export type StepOptions = {
    ignore?: boolean;
    sanitizeOps?: boolean;
    sanitizeResources?: boolean;
    sanitizeExit?: boolean;
  };

  /** Options for registering a test suite. */
  export type DescribeDefinition<T = Context> = TestOptions & {
    name: string;
    fn?: DescribeBody;
    suite?: TestSuite<T>;
    beforeAll?: Hook<T> | Hook<T>[];
    beforeEach?: Hook<T> | Hook<T>[];
    afterEach?: Hook<T> | Hook<T>[];
    afterAll?: Hook<T> | Hook<T>[];
  };

  /** Options for registering a leaf test. */
  export type ItDefinition<T = Context> = TestOptions & {
    name: string;
    fn: TestBody<T>;
    suite?: TestSuite<T>;
  };

  /** Supported `describe` overload tuples. */
  export type DescribeArgs<T = Context> =
    | [options: DescribeDefinition<T>]
    | [name: string]
    | [name: string, options: Omit<DescribeDefinition<T>, 'name'>]
    | [name: string, fn: DescribeBody]
    | [fn: DescribeBody]
    | [
      name: string,
      options: Omit<DescribeDefinition<T>, 'fn' | 'name'>,
      fn: DescribeBody,
    ]
    | [options: Omit<DescribeDefinition<T>, 'fn'>, fn: DescribeBody]
    | [options: Omit<DescribeDefinition<T>, 'fn' | 'name'>, fn: DescribeBody]
    | [suite: TestSuite<T>, name: string]
    | [
      suite: TestSuite<T>,
      name: string,
      options: Omit<DescribeDefinition<T>, 'name' | 'suite'>,
    ]
    | [suite: TestSuite<T>, name: string, fn: DescribeBody]
    | [suite: TestSuite<T>, fn: DescribeBody]
    | [
      suite: TestSuite<T>,
      name: string,
      options: Omit<DescribeDefinition<T>, 'fn' | 'name' | 'suite'>,
      fn: DescribeBody,
    ]
    | [
      suite: TestSuite<T>,
      options: Omit<DescribeDefinition<T>, 'fn' | 'suite'>,
      fn: DescribeBody,
    ]
    | [
      suite: TestSuite<T>,
      options: Omit<DescribeDefinition<T>, 'fn' | 'name' | 'suite'>,
      fn: DescribeBody,
    ];

  /** Supported `it` overload tuples. */
  export type ItArgs<T = Context> =
    | [options: ItDefinition<T>]
    | [name: string, options: Omit<ItDefinition<T>, 'name'>]
    | [name: string, fn: TestBody<T>]
    | [fn: TestBody<T>]
    | [name: string, options: Omit<ItDefinition<T>, 'fn' | 'name'>, fn: TestBody<T>]
    | [options: Omit<ItDefinition<T>, 'fn'>, fn: TestBody<T>]
    | [options: Omit<ItDefinition<T>, 'fn' | 'name'>, fn: TestBody<T>]
    | [suite: TestSuite<T>, name: string, options: Omit<ItDefinition<T>, 'name' | 'suite'>]
    | [suite: TestSuite<T>, name: string, fn: TestBody<T>]
    | [suite: TestSuite<T>, fn: TestBody<T>]
    | [
      suite: TestSuite<T>,
      name: string,
      options: Omit<ItDefinition<T>, 'fn' | 'name' | 'suite'>,
      fn: TestBody<T>,
    ]
    | [
      suite: TestSuite<T>,
      options: Omit<ItDefinition<T>, 'fn' | 'suite'>,
      fn: TestBody<T>,
    ]
    | [
      suite: TestSuite<T>,
      options: Omit<ItDefinition<T>, 'fn' | 'name' | 'suite'>,
      fn: TestBody<T>,
    ];

  /** Definition accepted by body-less ignored and todo modifiers. */
  export type PendingItDefinition<T = Context> = Omit<ItDefinition<T>, 'fn'> & {
    fn?: TestBody<T>;
  };

  /** Supported modifier tuples, including body-less ignored and todo tests. */
  export type ItModifierArgs<T = Context> =
    | ItArgs<T>
    | [name: string]
    | [options: PendingItDefinition<T>]
    | [name: string, options: Omit<PendingItDefinition<T>, 'name'>]
    | [suite: TestSuite<T>, name: string]
    | [
      suite: TestSuite<T>,
      name: string,
      options: Omit<PendingItDefinition<T>, 'name' | 'suite'>,
    ];

  /** Registers a test suite with one option set. */
  export type DescribeRegistration = <T = Context>(...args: DescribeArgs<T>) => TestSuite<T>;

  /** Registers a test suite. */
  export type Describe = DescribeRegistration & {
    readonly only: DescribeRegistration;
    readonly ignore: DescribeRegistration;
    readonly skip: DescribeRegistration;
    readonly todo: DescribeRegistration;
  };

  /** Registers a focused leaf test. */
  export type ItRegistration = <T = Context>(...args: ItArgs<T>) => void;

  /** Registers an ignored or todo leaf test. */
  export type ItModifier = <T = Context>(...args: ItModifierArgs<T>) => void;

  /** Registers a leaf test. */
  export type It = ItRegistration & {
    readonly only: ItRegistration;
    readonly ignore: ItModifier;
    readonly skip: ItModifier;
    readonly todo: ItModifier;
  };

  /** Registers one hook against the current suite. */
  export type HookRegistration = <T = Context>(fn: Hook<T>) => void;
}
