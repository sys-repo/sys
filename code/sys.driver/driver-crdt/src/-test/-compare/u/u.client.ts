import { Cmd, Err, Immutable, Is, Obj, Rx, type t } from '../common.ts';

/** One real worker and independent observers/writers for the two topology specimens. */
export async function openComparison(url: URL, replica: t.NativeFactory) {
  const worker = new Worker(url, { type: 'module' });
  const { port1, port2 } = new MessageChannel();
  worker.postMessage({ port: port2 }, [port2]);
  const factory = Cmd.make<t.Names, t.Payload, t.Results, t.Events>();
  const control = factory.client(port1, { timeout: 20_000 });
  const clients: Awaited<ReturnType<typeof connect>>[] = [];
  let peer: t.Native | undefined;
  try {
    const initial = await control.send('read', {});
    peer = replica(initial.binary);
    return {
      control,
      initial,
      peer,
      async connect(mode: t.Mode) {
        const wire = factory.client(port1, { timeout: 20_000 });
        try {
          const client = await connect(wire, mode, replica);
          clients.push(client);
          return client;
        } catch (error) {
          wire.dispose();
          throw error;
        }
      },
      async [Symbol.asyncDispose]() {
        try {
          await control.send('release', {});
          await Promise.all(clients.map((client) => client.settle()));
        } finally {
          try {
            for (const client of clients) await client.dispose();
            await peer?.dispose();
            await control.send('shutdown', {});
          } finally {
            control.dispose();
            port1.close();
            worker.terminate();
          }
        }
      },
    };
  } catch (error) {
    await peer?.dispose();
    control.dispose();
    port1.close();
    worker.terminate();
    throw error;
  }
}

/** No engine selector or native document leaks through the application-facing test facade. */
async function connect(wire: t.WireClient, mode: t.Mode, replica: t.NativeFactory) {
  const seed = await wire.send('read', {});
  const native = mode === 'native-replica' ? replica(seed.binary) : undefined;
  const state = Immutable.clonerRef(native?.capture() ?? seed.snapshot);
  const life = Rx.lifecycle();
  const trace: string[] = [];
  const submissions: Promise<t.Receipt>[] = [];
  const held: t.Frame[] = [];
  let hold = false;
  let disposed = false;
  let writing = false;
  let streamFailure: { error: unknown } | undefined;
  const initial = Promise.withResolvers<void>();
  const stream = wire.stream('observe', {});
  // Own the terminal rejection immediately; disposal still awaits actual stream settlement.
  const streamDone = stream.done.then(() => {
    if (!disposed) {
      const error = Err.std('Fixture observation stream ended unexpectedly.');
      streamFailure = { error };
      initial.reject(error);
    }
  }, (error) => {
    if (!disposed) {
      streamFailure = { error };
      initial.reject(error);
    }
  });

  const publish = (
    next: t.Snapshot,
    callback?: t.ImmutablePatchCallback<t.Rfc6902PatchOperation>,
  ) => {
    state.change((draft) => {
      draft.value = next.value;
      draft.basis = next.basis;
      draft.metadata = next.metadata;
      draft.selection = next.selection;
    }, (patches) => {
      const value = valuePatches(patches);
      trace.push(`value-patches:${value.length}`);
      callback?.(value);
    });
  };
  const apply = (frame: t.Frame) => {
    if (native) native.apply(frame.binary);
    publish(native?.capture() ?? frame.snapshot);
    trace.push(`observation:applied:${frame.revision}`);
  };
  const subscription = stream.onEvent((frame) => {
    trace.push(`observation:received:${frame.revision}`);
    if (hold) {
      if (held.length >= 8) throw Err.std('Fixture observation buffer exceeded eight frames.');
      held.push(frame);
    } else apply(frame);
    initial.resolve();
  });

  function submit() {
    if (!native) throw Err.std('No local native author in the async-owner specimen.');
    const pending = wire.send('submit', { binary: native.save() }).then((receipt) => {
      trace.push(`receipt:${receipt.accepted ? 'accepted' : 'rejected'}`);
      return receipt;
    });
    // The fixture owns every promise until settle()/dispose(); callers can await the original.
    pending.catch(() => undefined);
    submissions.push(pending);
  }

  function local(fn: () => void, callback?: t.ImmutablePatchCallback<t.Rfc6902PatchOperation>) {
    if (disposed) throw Err.std('Fixture client is disposed.');
    if (!native) throw Err.std('Async owner cannot execute a caller-local mutation callback.');
    if (writing) throw Err.std('Reentrant native author is unsupported.');
    const basis = native.capture().basis;
    writing = true;
    try {
      try {
        fn();
      } finally {
        // Yjs may have committed earlier writes before the callback threw.
        const next = native.capture();
        try {
          publish(next, callback);
        } finally {
          if (next.basis !== basis) submit();
        }
      }
    } finally {
      writing = false;
    }
  }

  const view: t.View = {
    instance: state.instance,
    get current() {
      return state.current.value;
    },
    events(until) {
      const events = state.events([life.dispose$, until]);
      const $ = events.$.pipe(Rx.map((event): t.Change => ({
        before: event.before.value,
        after: event.after.value,
        patches: valuePatches(event.patches),
        native: { before: event.before, after: event.after },
      })));
      return Rx.toLifecycle<t.ViewEvents>(events, {
        $,
        path: Immutable.Events.pathFilter($, (patch) => Immutable.Patch.toObjectPath(patch.path)),
      });
    },
  };
  const ref: t.Ref | undefined = native?.change
    ? {
      ...view,
      get current() {
        return view.current;
      },
      change(fn, options) {
        const callback = Is.func(options) ? options : options?.patches;
        local(() => native.change?.(fn), callback);
      },
    }
    : undefined;

  async function dispose() {
    if (disposed) return;
    disposed = true;
    subscription.dispose();
    stream.dispose();
    wire.dispose();
    await streamDone;
    life.dispose();
    await Promise.allSettled(submissions);
    await native?.dispose();
  }

  try {
    await initial.promise;
  } catch (error) {
    await dispose();
    throw error;
  }
  return {
    view,
    ref,
    trace,
    writer: native?.writer,
    get snapshot() {
      return state.current;
    },
    get heldObservations() {
      return held.length;
    },
    get submissionCount() {
      return submissions.length;
    },
    holdObservations() {
      hold = true;
    },
    releaseObservations() {
      hold = false;
      for (const frame of held.splice(0)) apply(frame);
    },
    write(payload: t.Write) {
      if (mode !== 'async-owner') {
        throw Err.std('Use the local author in the native-replica specimen.');
      }
      if (disposed) throw Err.std('Fixture client is disposed.');
      const intent = Obj.clone(payload);
      const pending = wire.send('write', intent).then((receipt) => {
        trace.push(`receipt:${receipt.accepted ? 'accepted' : 'rejected'}`);
        return { ...receipt, intent };
      });
      pending.catch(() => undefined);
      submissions.push(pending);
      return pending;
    },
    transact(fn: (edit: t.Editor) => void) {
      local(() => native?.author(fn));
    },
    async settle() {
      const result = await Promise.all(submissions);
      if (streamFailure) throw streamFailure.error;
      return result;
    },
    dispose,
  };
}

/** These are projection patches only. Metadata changes travel in the event's native context. */
function valuePatches(patches: readonly t.Rfc6902PatchOperation[]): t.Rfc6902PatchOperation[] {
  return patches.filter((patch) => patch.path.startsWith('/value/')).map((patch) => ({
    ...patch,
    path: patch.path.slice('/value'.length),
  }));
}
