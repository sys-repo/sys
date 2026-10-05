import { Cmd, Err, type t } from '../common.ts';
import { deliveryCheckpoint } from '../../u/u.delivery.ts';

/** Trusted fixture control plane over Cmd; not a production admission/authorization protocol. */
export function serve(native: t.Native) {
  // One port-transfer bootstrap, then all control and data messages use Cmd on that port.
  globalThis.addEventListener('message', (event: MessageEvent<{ port: MessagePort }>) => {
    host(event.data.port, native);
  }, { once: true });
}

function host(scope: t.Cmd.Endpoint, native: t.Native) {
  const cmd = Cmd.make<t.Names, t.Payload, t.Results, t.Events>();
  const observers = new Set<(frame: t.Frame) => void>();
  let checkpoint: ReturnType<typeof deliveryCheckpoint> | undefined;
  let allow = true;
  let revision = 0;
  const frame = (): t.Frame => ({
    snapshot: native.capture(),
    binary: native.save(),
    writer: native.writer,
    revision,
  });
  const publish = () => {
    revision += 1;
    const next = frame();
    for (const emit of observers) emit(next);
    return next;
  };
  cmd.host(scope, {
    read: frame,
    observe(_payload, ctx) {
      observers.add(ctx.emit);
      ctx.emit(frame());
      return new Promise<void>((resolve) => {
        ctx.signal.addEventListener('abort', () => {
          observers.delete(ctx.emit);
          resolve();
        }, { once: true });
      });
    },
    hold() {
      if (checkpoint) throw Err.std('Only one held submission phase per fixture.');
      checkpoint = deliveryCheckpoint();
    },
    arrived: () => checkpoint?.arrived,
    release() {
      checkpoint?.release();
    },
    admission: ({ allow: value }) => {
      allow = value;
    },
    async write(payload) {
      await checkpoint?.hold();
      const reject = (reason: 'stale-basis' | 'missing-item' | 'policy'): t.Receipt => ({
        accepted: false,
        reason,
        callback: 'owner',
        frame: frame(),
      });
      if (!allow) return reject('policy');
      const before = native.capture();
      if (payload.kind === 'label-index' && payload.basis !== before.basis) {
        return reject('stale-basis');
      }
      const index = payload.kind === 'label-id'
        ? before.value.items.findIndex((item) => item.id === payload.id)
        : payload.kind === 'label-index'
        ? payload.index
        : -1;
      if (payload.kind === 'label-id' && index < 0) return reject('missing-item');
      native.author((edit) => {
        switch (payload.kind) {
          case 'label-id':
          case 'label-index':
            edit.label(index, payload.value);
            break;
          case 'compose':
            edit.title(payload.title);
            edit.format(0, 1, payload.bold);
            break;
          case 'format':
            edit.format(0, 1, payload.bold);
            break;
          case 'delete-text':
            edit.deleteText(0, 1);
            break;
        }
      });
      return { accepted: true, callback: 'owner', frame: publish() };
    },
    async submit({ binary }) {
      await checkpoint?.hold();
      if (!allow) return { accepted: false, reason: 'policy', callback: 'caller', frame: frame() };
      native.apply(binary);
      return { accepted: true, callback: 'caller', frame: publish() };
    },
    peer({ binary }) {
      // An independent native peer may advance the owner while client admission is held.
      native.apply(binary);
      return publish();
    },
    async shutdown() {
      checkpoint?.release();
      await native.dispose();
      // The parent terminates the owned worker after receiving this result. In particular,
      // Repo.shutdown is not claimed to drain its sync throttle inside a surviving worker.
    },
  });
}
