import type { t } from './common.ts';

/**
 * Deno task discovery and dispatch helpers.
 */
export declare namespace DenoTask {
  /** Library surface for reading, selecting, and running tasks declared in `deno.json`. */
  export type Lib = {
    /** List tasks from a `deno.json` file using inclusion and exclusion patterns. */
    list(options: List.Options): Promise<readonly Task[]>;

    /** Run a declared task through `deno task <name>` with inherited terminal stdio. */
    run(options: Run.Options): Promise<Run.Result>;

    /** Interactive and non-interactive task menu helpers. */
    readonly Menu: Menu.Lib;
  };

  /** Task name as declared under `deno.json.tasks`. */
  export type TaskName = string;

  /** Inclusion or exclusion pattern matched against task names. */
  export type Pattern = t.StringGlob | t.StringGlob[];

  /** Declared Deno task entry. */
  export type Task = {
    /** Task name. */
    readonly name: TaskName;
    /** Raw command string from `deno.json.tasks[name]`. */
    readonly command: string;
  };

  /**
   * Task listing helpers.
   */
  export namespace List {
    /** Options for listing tasks from a package-local `deno.json`. */
    export type Options = {
      /** Directory whose `deno.json` owns the task surface. */
      cwd: t.StringDir;
      /** Task-name patterns to include. */
      include: Pattern;
      /** Optional task-name patterns to exclude after inclusion. */
      exclude?: Pattern;
    };
  }

  /**
   * Task execution helpers.
   */
  export namespace Run {
    /** Options for running a selected Deno task. */
    export type Options = {
      /** Directory whose `deno.json` owns the task surface. */
      cwd: t.StringDir;
      /** Name of the task to run. */
      name: TaskName;
    };

    /** Result from running a task through `deno task`. */
    export type Result = {
      /** Task that was run. */
      readonly name: TaskName;
      /** Child-process exit status. */
      readonly output: t.Process.InheritOutput;
    };
  }

  /**
   * Interactive task menu helpers.
   */
  export namespace Menu {
    /** Library surface for the task menu entrypoint. */
    export type Lib = {
      /** Run a task menu from raw CLI argv. */
      main(options: MainOptions): Promise<Result>;
    };

    /** Options for the task menu entrypoint. */
    export type MainOptions = List.Options & {
      /** Raw CLI argv passed to the wrapper script. */
      argv?: string[];
      /** Human-facing menu title. */
      title: string;
    };

    /** Result from the task menu entrypoint. */
    export type Result = Help | List | Exit | Selected | Error;

    /** Help output was printed. */
    export type Help = {
      /** Result discriminant. */
      readonly kind: 'help';
      /** Rendered help text. */
      readonly text: string;
    };

    /** Task list output was printed. */
    export type List = {
      /** Result discriminant. */
      readonly kind: 'list';
      /** Matching tasks. */
      readonly tasks: readonly Task[];
      /** Rendered list text. */
      readonly text: string;
    };

    /** User exited without selecting a task. */
    export type Exit = {
      /** Result discriminant. */
      readonly kind: 'exit';
    };

    /** A task was selected and run. */
    export type Selected = {
      /** Result discriminant. */
      readonly kind: 'selected';
      /** Task that was selected. */
      readonly task: Task;
      /** Run result. */
      readonly run: Run.Result;
    };

    /** Invocation failed before a task could be run. */
    export type Error = {
      /** Result discriminant. */
      readonly kind: 'error';
      /** Suggested process exit code. */
      readonly code: number;
      /** Failure message. */
      readonly message: string;
      /** Rendered failure/help text when available. */
      readonly text?: string;
    };
  }
}
