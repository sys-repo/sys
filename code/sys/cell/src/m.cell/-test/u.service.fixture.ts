import { Str } from '../../-test.ts';

const serviceFixtureUrl = import.meta.url;

const state: {
  events: string[];
  resolvers: Record<string, () => void>;
} = {
  events: [],
  resolvers: {},
};

export function resetServiceEvents() {
  state.events = [];
}

export function pushServiceEvent(event: string) {
  state.events.push(event);
}

export function serviceEvents(): readonly string[] {
  return state.events;
}

export function resetParallelResolvers() {
  state.resolvers = {};
}

export function setParallelResolver(name: string, resolve: () => void) {
  state.resolvers[name] = resolve;
}

export function resolveParallel(name: string) {
  const resolve = state.resolvers[name];
  if (!resolve) throw new Error(`Missing service resolver: ${name}`);
  resolve();
}

export const ServiceEndpointFixture = {
  captureArgs: () => serviceModule(`
    export const Capture = {
      start(args) { return { ...args, finished: Promise.resolve('done') }; },
    };
  `),

  variantArgs: () => serviceModule(`
    export const Variant = {
      start(args) { return { ...args, finished: Promise.resolve('done') }; },
    };
  `),

  failingStart: () => serviceModule(`
    export const Failing = {
      start() { throw new Error('boom'); },
    };
  `),

  hangingStart: () => serviceModule(`
    export const Hanging = {
      start() { return new Promise(() => {}); },
    };
  `),

  parallel() {
    return serviceModule(`
      import { pushServiceEvent, setParallelResolver } from '${serviceFixtureUrl}';

      function start(name) {
        pushServiceEvent('start:' + name);
        return new Promise((resolve) => {
          setParallelResolver(name, () => resolve({
            name,
            finished: Promise.resolve('done'),
            close(reason) { pushServiceEvent('close:' + name + ':' + String(reason)); },
          }));
        });
      }

      export const First = { start() { return start('first'); } };
      export const Second = { start() { return start('second'); } };
    `);
  },

  closeReverse() {
    return serviceModule(`
      import { pushServiceEvent } from '${serviceFixtureUrl}';

      export const First = {
        start() {
          pushServiceEvent('start:first');
          return { close(reason) { pushServiceEvent('close:first:' + String(reason)); } };
        },
      };
      export const Second = {
        start() {
          pushServiceEvent('start:second');
          return { close(reason) { pushServiceEvent('close:second:' + String(reason)); } };
        },
      };
    `);
  },

  cleanupAfterFailure() {
    return serviceModule(`
      import { pushServiceEvent } from '${serviceFixtureUrl}';

      export const First = {
        start() {
          pushServiceEvent('start:first');
          return { close() { pushServiceEvent('close:first'); throw new Error('close:first'); } };
        },
      };
      export const Second = {
        start() {
          pushServiceEvent('start:second');
          return { close() { pushServiceEvent('close:second'); } };
        },
      };
      export const Failing = {
        start() {
          pushServiceEvent('start:fail');
          throw new Error('boom');
        },
      };
    `);
  },

  cancelableHanging() {
    return serviceModule(`
      import { pushServiceEvent } from '${serviceFixtureUrl}';

      export const Hanging = {
        start() {
          pushServiceEvent('start:view');
          return new Promise(() => {});
        },
      };
    `);
  },

  lateHandle() {
    return serviceModule(`
      import { pushServiceEvent, setParallelResolver } from '${serviceFixtureUrl}';

      export const Slow = {
        start() {
          pushServiceEvent('start:slow');
          return new Promise((resolve) => {
            setParallelResolver('slow', () => resolve({
              finished: Promise.resolve('done'),
              close(reason) { pushServiceEvent('close:slow:' + String(reason)); },
            }));
          });
        },
      };
    `);
  },
} as const;

function serviceModule(source: string) {
  return `data:application/javascript;base64,${btoa(Str.dedent(source).trimStart())}`;
}
