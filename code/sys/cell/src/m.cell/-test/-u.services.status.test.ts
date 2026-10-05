import { describe, expect, it, type t, Time } from '../../-test.ts';
import { serviceStatusesOf, serviceStatusOf } from '../u.services/u.status.ts';

describe('Cell.Services.status', () => {
  it('normalizes status handles without replacing Cell descriptor facts', () => {
    const service = startedService({
      handle: {
        status(): t.Service.Status {
          return {
            state: 'ready',
            name: 'owner-local-name',
            kind: 'fixture',
            root: '/srv/view' as t.StringDir,
            urls: [{ href: 'http://127.0.0.1:4321/view/' as t.StringUrl, label: 'path' }],
            details: [{ label: 'dist', value: 'dist/' }],
          };
        },
      },
    });

    const status = serviceStatusOf(service);

    expect(status.service.name).to.eql('descriptor-name');
    expect(status.service.from).to.eql('./-services/service.ts');
    expect(status.paths.config).to.eql('/cell/-config/service.yaml');
    expect(status.owner?.name).to.eql('owner-local-name');
    expect(status.owner?.root).to.eql('/srv/view');
    expect(status.owner?.urls?.[0]?.href).to.eql('http://127.0.0.1:4321/view/');
  });

  it('does not probe owner-specific handle fields when status() is absent', () => {
    const status = serviceStatusOf(startedService({
      handle: {
        origin: 'http://127.0.0.1:4321',
        url: 'http://127.0.0.1:4321/view/',
        location: { dir: '/srv/view' },
      },
    }));

    expect(status.owner).to.eql(undefined);
    expect(status.service.name).to.eql('descriptor-name');
  });

  it('turns invalid or failing status reads into error snapshots', () => {
    const statuses = serviceStatusesOf({
      services: [
        startedService({
          handle: {
            status() {
              throw new Error('boom');
            },
          },
        }),
        startedService({
          handle: {
            status() {
              return { state: 'ready', urls: [{ label: 'missing-href' }] };
            },
          },
        }),
      ],
      close: async () => undefined,
    });

    expect(statuses[0].owner?.state).to.eql('error');
    expect(statuses[0].owner?.error?.message).to.contain('boom');
    expect(statuses[1].owner?.state).to.eql('error');
    expect(statuses[1].owner?.error?.message).to.contain('invalid status snapshot');
  });
});

/**
 * Helpers:
 */
function startedService(input: { readonly handle: unknown }): t.Cell.Services.StartedService {
  const now = Time.now.timestamp;
  const service = selectedService();
  return {
    service,
    selection: {
      name: service.name,
      mode: 'default',
      descriptor: service,
      binding: {
        use: service.use,
        from: service.from,
        config: service.config,
      },
    },
    paths: { config: '/cell/-config/service.yaml' as t.StringPath },
    endpoint: { start: () => input.handle },
    handle: input.handle,
    metrics: { start: { startedAt: now, resolvedAt: now } },
  };
}

function selectedService(): t.Cell.Services.SelectedService {
  return {
    name: 'descriptor-name' as t.Cell.Id,
    use: 'Service',
    from: './-services/service.ts',
    config: './-config/service.yaml' as t.Cell.Path,
  };
}
