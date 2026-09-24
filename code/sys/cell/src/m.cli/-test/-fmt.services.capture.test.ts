import { describe, expect, Fs, it, type t, Testing } from '../../-test.ts';
import { Cli, stripAnsi } from '../common.ts';
import { Fmt } from '../u.fmt/u.mod.ts';
import { serviceInput, startedService } from './u.fixture.services.ts';

const render = (services: readonly t.Cli.Fmt.Service.Input[], width?: number) => {
  return Fmt.Services.started({ services, width, terminal: false });
};

describe('@sys/cell/cli service presentation capture', () => {
  it('renamed details → callbacks receive originals; plain output uses Cell labels and values', () => {
    const details = [
      { label: 'dist', value: '#abc' },
      { label: 'files.capabilities', value: 'list,read' },
      { label: 'connections', value: '1' },
      { label: 'namespace', value: 'private' },
      { label: 'files.kind', value: 'files/fs' },
      { label: 'path', value: '/' },
      { label: 'port', value: '1234' },
    ];
    const calls: t.Service.Detail[] = [];
    const receivers: unknown[] = [];
    const handle = {
      status: (): t.Service.Status => ({
        state: 'ready',
        name: 'owner name',
        urls: [{ href: 'http://localhost:1234/' }],
        details,
      }),
      servicePresentation: {
        formatDetail(this: unknown, { detail }: Parameters<t.Cli.Fmt.Service.FormatDetail>[0]) {
          calls.push(detail);
          receivers.push(this);
          return undefined;
        },
      },
    };
    const service = serviceInput({ name: 'selected', variant: 'dev', handle });
    const text = stripAnsi(render([service]));

    expect(calls).to.have.length(2);
    expect(calls[0]).to.equal(details[0]);
    expect(calls[1]).to.equal(details[1]);
    expect(receivers).to.eql([undefined, undefined]);
    expect(service.status?.details).to.eql([
      { label: 'build', value: 'dist:#abc' },
      { label: 'capabilities', value: 'list, read' },
    ]);
    expect(service.status?.details?.[0]).not.to.equal(details[0]);
    expect(text).to.contain('selected --mode=dev');
    expect(text).not.to.contain('owner name');
    expect(text).to.contain('dist:#abc');
    expect(text).to.contain('list, read');
    expect(details[0]).to.eql({ label: 'dist', value: '#abc' });
    expect(details[1]).to.eql({ label: 'files.capabilities', value: 'list,read' });

    const withoutUrls = serviceInput({ owner: { state: 'ready', details: details.slice(5) } });
    expect(withoutUrls.status?.details).to.eql(details.slice(5));
  });

  it('capture → retains status, relative paths, and formatter across later mutations', async () => {
    const cwd = Fs.cwd();
    const fs = await Testing.dir('CellCli.presentation.capture');
    const detail = { label: 'dist', value: '#abc' };
    const owner = {
      state: 'ready' as t.Service.State,
      root: Fs.join(cwd, 'view'),
      urls: [{ href: 'http://example.test/original' }],
      details: [detail],
      error: { name: 'Error', message: 'original' },
    };
    let statusReads = 0;
    let presentationReads = 0;
    let formatReads = 0;
    const calls: Parameters<t.Cli.Fmt.Service.FormatDetail>[0][] = [];
    let format: t.Cli.Fmt.Service.FormatDetail = (args) => {
      calls.push(args);
      return undefined;
    };
    const handle = {
      status() {
        statusReads += 1;
        return owner;
      },
      get servicePresentation() {
        presentationReads += 1;
        return {
          get formatDetail() {
            formatReads += 1;
            return format;
          },
        };
      },
    };
    const services = Fmt.Services.capture([startedService({ handle })]);
    expect(calls).to.eql([]);
    const captured = services[0].status;
    expect(captured?.root).to.eql('./view');
    owner.state = 'stopped';
    owner.root = '/changed';
    owner.urls[0].href = 'http://example.test/changed';
    owner.error.message = 'changed';
    detail.value = '#changed';
    format = () => {
      throw new Error('replacement callback');
    };

    try {
      Deno.chdir(fs.dir);
      const wide = stripAnsi(render(services, 120));
      render(services, 30);
      expect(wide).to.contain('dist:#abc');
      expect(wide).to.contain('view');
      expect(wide).to.contain('http://example.test/original');
      expect(wide).to.contain('Error: original');
      expect(wide).not.to.contain('changed');
      expect(wide).not.to.contain('stopped');
    } finally {
      Deno.chdir(cwd);
    }
    expect({ statusReads, presentationReads, formatReads }).to.eql({
      statusReads: 1,
      presentationReads: 1,
      formatReads: 1,
    });
    expect(calls).to.have.length(2);
    expect(calls[0].detail).to.equal(detail);
    expect(calls[1].detail).to.equal(detail);
    expect(calls[1].maxWidth).to.be.lessThan(calls[0].maxWidth!);
    expect(captured?.root).to.eql('./view');
  });

  it('equal details → each service keeps its own callback and link target', () => {
    const facts = [{ label: 'shell', value: 'same' }, { label: 'shell', value: 'same' }];
    const targets = ['file:///tmp/first', 'file:///tmp/second'];
    const calls: t.Service.Detail[] = [];
    const services = facts.map((fact, index) => {
      const servicePresentation: t.Cli.Fmt.Service.Presentation = {
        formatDetail({ detail }) {
          calls.push(detail);
          return Cli.Fmt.hyperlink('same', new URL(targets[index]));
        },
      };
      const status = (): t.Service.Status => ({ state: 'ready', details: [fact] });
      return serviceInput({ handle: { status, servicePresentation } });
    });
    const text = render(services);
    expect(calls[0]).to.equal(facts[0]);
    expect(calls[1]).to.equal(facts[1]);
    for (const href of targets) expect(text).to.contain(`\x1b]8;;${href}\x1b\\`);
  });

  it('custom formatting → keeps empty values and falls back to Cell text when too wide', () => {
    const status = (): t.Service.Status => ({
      state: 'ready',
      details: [{ label: 'dist', value: '#abc' }],
    });
    for (const value of [undefined, '', `fits\n${'x'.repeat(50)}`]) {
      let calls = 0;
      const servicePresentation = {
        formatDetail() {
          calls += 1;
          return value;
        },
      };
      const input = serviceInput({ handle: { status, servicePresentation } });
      expect(render([input], 0)).to.eql('');
      expect(calls).to.eql(0);
      const text = stripAnsi(render([input], 30));
      if (value === '') expect(text).not.to.contain('dist:#abc');
      else expect(text).to.contain('dist:#abc');
      expect(text).not.to.contain('fits');
      expect(calls).to.eql(1);
    }
    const servicePresentation = { formatDetail: () => null };
    const input = serviceInput({ handle: { status, servicePresentation } });
    expect(() => render([input])).to.throw(TypeError);
  });

  it('no displayed details → skips formatter getters and nested handles', () => {
    const unavailable = () => {
      throw new Error('presentation must not be read');
    };
    const filtered: t.Service.Status = {
      state: 'ready',
      details: [{ label: 'connections', value: '1' }],
    };
    const hidden = {
      get servicePresentation() {
        return unavailable();
      },
    };
    const handles = [
      hidden,
      {
        status: () => filtered,
        get servicePresentation() {
          return unavailable();
        },
      },
      { server: hidden },
    ];
    for (const handle of handles) {
      const input = serviceInput({ handle });
      expect(input.presentation).to.eql(undefined);
      expect(stripAnsi(render([input]))).to.contain('view');
    }
  });

  it('wrapper handles → use presentation only when explicitly forwarded', () => {
    const status = (): t.Service.Status => ({
      state: 'ready',
      details: [{ label: 'shell', value: 'plain' }],
    });
    const servicePresentation = { formatDetail: () => 'rich' };
    const owner = { status, servicePresentation };
    const plain = serviceInput({ handle: { status, server: owner } });
    const forwarded = serviceInput({ handle: { status, servicePresentation, server: owner } });
    expect(stripAnsi(render([plain]))).to.contain('plain');
    expect(stripAnsi(render([plain]))).not.to.contain('rich');
    expect(stripAnsi(render([forwarded]))).to.contain('rich');
  });

  it('presentation → accepts absent formatters but rejects invalid values and throwing getters', () => {
    const status = (): t.Service.Status => ({
      state: 'ready',
      details: [{ label: 'shell', value: 'plain' }],
    });
    for (const servicePresentation of [null, 1, { formatDetail: null }, { formatDetail: 1 }]) {
      const capture = () => serviceInput({ handle: { status, servicePresentation } });
      expect(capture).to.throw(TypeError);
    }
    for (const servicePresentation of [undefined, {}, { formatDetail: undefined }]) {
      const input = serviceInput({ handle: { status, servicePresentation } });
      expect(input.presentation).to.eql(undefined);
      expect(stripAnsi(render([input]))).to.contain('plain');
    }
    const cause = new Error('capability read failed');
    const handles = [
      {
        status,
        get servicePresentation() {
          throw cause;
        },
      },
      {
        status,
        servicePresentation: {
          get formatDetail() {
            throw cause;
          },
        },
      },
    ];
    for (const handle of handles) {
      const capture = () => serviceInput({ handle });
      expect(capture).to.throw(cause);
    }
  });

  it('status failures → render method errors but propagate getter errors', () => {
    const handles = [
      {
        status() {
          throw new Error('status failed');
        },
      },
      { status: () => ({ state: 'invalid' }) },
    ];
    for (const handle of handles) {
      const input = serviceInput({ handle });
      expect(input.status?.state).to.eql('error');
      expect(input.presentation).to.eql(undefined);
      expect(stripAnsi(render([input]))).to.contain('Error:');
    }
    const cause = new Error('status getter failed');
    const handle = {
      get status() {
        throw cause;
      },
    };
    expect(() => serviceInput({ handle })).to.throw(cause);
  });
});
