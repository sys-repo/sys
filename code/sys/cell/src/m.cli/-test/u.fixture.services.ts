import { type t, Time } from '../../-test.ts';
import { Fmt } from '../u.fmt/u.mod.ts';

export type ServiceOptions = {
  readonly name?: t.Cell.Id;
  readonly from?: string;
  readonly variant?: t.Cell.Id;
  readonly owner?: t.Service.Status;
  readonly handle?: unknown;
};

export function startedService(options: ServiceOptions = {}): t.Cell.Services.StartedService {
  const now = Time.now.timestamp;
  const name = options.name ?? 'view';
  const variant = options.variant;
  const service: t.Cell.Services.SelectedService = {
    name,
    use: 'Serve',
    from: options.from ?? 'jsr:@sample/service',
    config: './-config/view.yaml',
  };
  const handle = options.handle ?? (options.owner ? { status: () => options.owner } : {});
  return {
    service,
    selection: {
      name,
      mode: variant ?? 'default',
      ...(variant ? { variant } : {}),
      descriptor: service,
      binding: service,
    },
    paths: { config: '/tmp/view.yaml' },
    metrics: { start: { startedAt: now, resolvedAt: now } },
    endpoint: { start: () => handle },
    handle,
  };
}

export function serviceInput(options: ServiceOptions = {}): t.Cli.Fmt.Service.Input {
  return Fmt.Services.capture([startedService(options)])[0];
}
