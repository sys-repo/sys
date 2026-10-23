import {
  type Loader,
  type LoadResponse,
  RequestedModuleType,
  ResolutionMode,
  Workspace,
  type WorkspaceOptions,
} from '@deno/loader';

export type DenoLoaderResolverCreateOptions = WorkspaceOptions & {
  readonly entrypoints?: readonly string[];
};

export type DenoLoaderResolveOptions = {
  readonly mode?: ResolutionMode;
};

export type DenoLoaderLoadOptions = {
  readonly requestedModuleType?: RequestedModuleType;
};

export type DenoLoaderResolverInstance = Disposable & {
  resolveSync(specifier: string, referrer?: string, options?: DenoLoaderResolveOptions): string;
  resolve(
    specifier: string,
    referrer?: string,
    options?: DenoLoaderResolveOptions,
  ): Promise<string>;
  load(specifier: string, options?: DenoLoaderLoadOptions): Promise<LoadResponse>;
};

export const DenoLoaderResolver = {
  async create(options: DenoLoaderResolverCreateOptions = {}): Promise<DenoLoaderResolverInstance> {
    const { entrypoints = [], ...workspaceOptions } = options;
    const workspace = new Workspace(workspaceOptions);
    let loader: Loader | undefined;

    try {
      loader = await workspace.createLoader();
      const diagnostics = entrypoints.length > 0
        ? await loader.addEntrypoints([...entrypoints])
        : [];
      if (diagnostics.length > 0) {
        throw new Error(
          `Deno loader resolver entrypoint diagnostics:\n${
            diagnostics.map((item) => item.message).join('\n')
          }`,
        );
      }

      const activeLoader = loader;
      let disposed = false;
      const assertOpen = () => {
        if (disposed) throw new Error('Deno loader resolver has been disposed.');
      };

      return {
        resolveSync(specifier, referrer, resolveOptions = {}) {
          assertOpen();
          return activeLoader.resolveSync(
            specifier,
            referrer,
            resolveOptions.mode ?? ResolutionMode.Import,
          );
        },
        async resolve(specifier, referrer, resolveOptions = {}) {
          assertOpen();
          return await activeLoader.resolve(
            specifier,
            referrer,
            resolveOptions.mode ?? ResolutionMode.Import,
          );
        },
        async load(specifier, loadOptions = {}) {
          assertOpen();
          return await activeLoader.load(
            specifier,
            loadOptions.requestedModuleType ?? RequestedModuleType.Default,
          );
        },
        [Symbol.dispose]() {
          if (disposed) return;
          disposed = true;
          activeLoader[Symbol.dispose]();
          workspace[Symbol.dispose]();
        },
      };
    } catch (error) {
      loader?.[Symbol.dispose]();
      workspace[Symbol.dispose]();
      throw error;
    }
  },
} as const;
