export declare namespace t {
  export namespace PiCliProfiles {
    export type Input = Readonly<{ argv?: readonly string[] }>;
    export type Result = Readonly<{
      kind: string;
      outcome?: string;
    }>;
    export type Lib = Readonly<{
      main(input?: Input): Promise<Result>;
      run(): Promise<never>;
      menu(): Promise<never>;
    }>;
  }
}

export const Pi = Object.freeze({});
export const pkg = Object.freeze({});

export const TaskCli = Object.freeze({
  input(argv: readonly string[] = []) {
    return Promise.resolve({ argv });
  },
});
