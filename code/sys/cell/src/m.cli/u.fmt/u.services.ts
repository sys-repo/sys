import { serviceStatusOf } from '../../m.cell/u.services/u.status.ts';
import { Cli, Fs, Is, type t } from '../common.ts';

type ServicesStartedOptions = {
  readonly services: readonly t.Cli.Fmt.Service.Input[];
  readonly width?: number;
  readonly terminal?: boolean;
  readonly hyperlinks?: boolean;
};

/** Capture Cell's display policy once; leave layout and detail fitting to the shared renderer. */
export const FmtServices = Object.freeze({
  capture(services: readonly t.Cell.Services.StartedService[]): readonly t.Cli.Fmt.Service.Input[] {
    return services.map(captureService);
  },
  started(options: ServicesStartedOptions): string {
    return Cli.Fmt.Service.formatList(options.services, {
      width: options.width,
      terminal: options.terminal,
      urlHyperlinks: options.hyperlinks,
    });
  },
});

/** Preserve selected identity and copy render-consumed facts without changing the owner snapshot. */
function captureService(started: t.Cell.Services.StartedService): t.Cli.Fmt.Service.Input {
  const { service, selection, owner } = serviceStatusOf(started);
  const identity = {
    name: service.name,
    module: service.from,
    ...(selection.variant ? { annotation: `--mode=${selection.variant}` } : {}),
  };
  if (!owner) return identity;

  const urls = owner.urls?.map(({ href }) => ({ href }));
  const sources = new Map<t.Service.Detail, t.Service.Detail>();
  const details: t.Service.Detail[] = [];
  for (const source of owner.details ?? []) {
    const projected = projectDetail(source, (urls?.length ?? 0) > 0);
    if (!projected) continue;
    details.push(projected);
    sources.set(projected, source);
  }
  const root = owner.root === undefined ? undefined : Fs.trimCwd(owner.root, { prefix: true });
  const error = owner.error;
  const status: t.Service.Status = {
    state: owner.state,
    ...(root && root !== './' ? { root } : {}),
    details,
    urls,
    ...(error ? { error: { name: error.name, message: error.message } } : {}),
  };
  // A capability is irrelevant when no owner detail survives Cell's projection.
  const format = details.length > 0 ? presentationOf(started.handle) : undefined;
  const presentation: t.Cli.Fmt.Service.Presentation | undefined = format
    ? {
      formatDetail({ detail, maxWidth }) {
        const source = sources.get(detail);
        if (!source) return undefined;
        return format({ detail: source, maxWidth });
      },
    }
    : undefined;
  return { ...identity, status, presentation };
}

function presentationOf(handle: unknown): t.Cli.Fmt.Service.FormatDetail | undefined {
  if (!Is.record(handle)) return undefined;
  const presentation = handle.servicePresentation;
  if (presentation === undefined) return undefined;
  if (!Is.record(presentation)) {
    throw new TypeError('Cell servicePresentation must be an object.');
  }
  const format = presentation.formatDetail;
  if (format === undefined) return undefined;
  if (!Is.func(format)) {
    throw new TypeError('Cell servicePresentation.formatDetail must be a function.');
  }
  return format as t.Cli.Fmt.Service.FormatDetail;
}

/** Each projected object has one source fact, even when labels and values are equal. */
function projectDetail(source: t.Service.Detail, hasUrls: boolean): t.Service.Detail | undefined {
  const { label, value } = source;
  if (label === 'connections' || label === 'namespace' || label === 'files.kind') return undefined;
  if (hasUrls && (label === 'path' || label === 'port')) return undefined;
  if (label === 'files.capabilities') {
    const capabilities = value.split(',').map((part) => part.trim()).filter(Boolean).join(', ');
    return { label: 'capabilities', value: capabilities };
  }
  if (label === 'dist') {
    return { label: 'build', value: value.startsWith('#') ? `dist:${value}` : value };
  }
  return { label, value };
}
