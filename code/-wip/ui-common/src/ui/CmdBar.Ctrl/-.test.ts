import { Ctrl, DEFAULTS } from './mod.ts';
import { Immutable, ObjectPath, Time, describe, expect, it, rx, type t } from '../../-test.ts';
import { CmdBar } from '../CmdBar/mod.ts';

describe('CmdBar.Ctrl', () => {
  const testSetup = () => {
    const life = rx.lifecycle();
    const transport = Immutable.clonerRef({});
    const ctrl = CmdBar.Ctrl.create({ transport });
    const cmd = Ctrl.toCmd(ctrl);
    const paths = DEFAULTS.paths;

    const ref: t.CmdBarRef = {
      ctrl,
      paths,
      resolve: CmdBar.Path.resolver(paths),
      dispose$: life.dispose$,
      current: { text: '', selection: { start: 0, end: 0 }, focused: false },
      onChange(_fn, _dispose$) {
        return null as any;
      },
    };
    return { ref, cmd, transport, life } as const;
  };

  it('exposed from <CmdBar>', () => {
    expect(CmdBar.Ctrl).to.equal(Ctrl);
    expect(CmdBar.Is).to.equal(Ctrl.Is);
    expect(CmdBar.Path).to.equal(Ctrl.Path);
  });

  it('create: from simple Immutable<T>', async () => {
    const transport = Immutable.clonerRef({});
    const ctrl1 = Ctrl.create({ transport });
    const ctrl2 = Ctrl.create(); // NB: auto immutable "transport" construction.
    const expectCount = (length: number) => {
      const paths = CmdBar.DEFAULTS.paths;
      const cmd = ObjectPath.resolve<t.CmdPathsObject>(transport.current, paths.cmd);
      expect(cmd?.queue?.length).to.eql(length);
    };

    let fired = 0;
    ctrl1.events().on('Invoke', () => fired++);
    Ctrl.toCmd(ctrl2)
      .events()
      .on('Invoke', () => fired++);

    expectCount(0);
    ctrl1.invoke({ text: 'foo' });
    ctrl2.invoke({ text: 'bar' });
    await Time.wait(0);
    expectCount(1);
    expect(fired).to.eql(2);
  });

  it('create: with issuer', async () => {
    const transport = Immutable.clonerRef({});
    const issuer = 'me:foo';
    const ctrl1 = Ctrl.create({ transport });
    const ctrl2 = Ctrl.create({ transport, issuer });

    let fired: (string | undefined)[] = [];
    ctrl1.events().on('Invoke', (e) => fired.push(e.issuer));
    ctrl2.events().on('Invoke', (e) => fired.push(e.issuer));

    ctrl1.invoke({ text: 'foo' }); // NB: no-issuer.
    await Time.wait(0);
    expect(fired).to.eql([undefined, undefined]);

    fired = [];
    ctrl2.invoke({ text: 'bar' });
    await Time.wait(0);
    expect(fired).to.eql([issuer, issuer]);
  });

  it('create: with path from prefix', async () => {
    const transport = Immutable.clonerRef({});
    const ctrl = Ctrl.create({ transport, paths: ['foo', 'bar'] });

    let fired = 0;
    ctrl.events().on('Invoke', (e) => fired++);

    ctrl.invoke({ text: 'foo' });
    await Time.wait(0);

    const current = transport.current as any;
    expect(current.foo.bar.cmd.queue[0].params).to.eql({ text: 'foo' });
  });

  it('Ctrl.toCtrl', () => {
    const ctrl = Ctrl.create();
    const { cmd, ref } = testSetup();

    const ctrl1 = Ctrl.toCtrl(cmd); // From raw command.
    const ctrl2 = Ctrl.toCtrl(cmd); // From raw command (new instance)
    const ctrl3 = Ctrl.toCtrl(ctrl1);
    const ctrl4 = Ctrl.toCtrl(ctrl);
    const ctrl5 = Ctrl.toCtrl(ref);

    expect(CmdBar.Is.ctrl(ctrl1)).to.eql(true);
    expect(ctrl1).to.not.equal(ctrl2);
    expect(ctrl3).to.equal(ctrl1); // NB: same instance reused.
    expect(ctrl4).to.equal(ctrl);
    expect(ctrl5).to.equal(ref.ctrl);
  });

  it('Ctrl.toCmd', () => {
    const { cmd, ref } = testSetup();
    expect(Ctrl.toCmd(cmd)).to.eql(cmd);
    expect(Ctrl.toCmd(ref)).to.eql(cmd);
    expect(Ctrl.toCmd(ref.ctrl)).to.eql(cmd);
  });

  it('Ctrl.toCmd (default)', () => {
    const { cmd, ref, transport } = testSetup();
    expect(Ctrl.toPaths(cmd)).to.eql(DEFAULTS.paths);
    expect(Ctrl.toPaths(ref)).to.eql(DEFAULTS.paths);
    expect(Ctrl.toPaths(ref.ctrl)).to.eql(DEFAULTS.paths);
  });

  it('Ctrl.toCmd (custom)', () => {
    const paths = CmdBar.Ctrl.Path.prepend(['foo', 'bar']);
    const ctrl = Ctrl.create({ paths });
    const cmd = Ctrl.toCmd(ctrl);
    expect(Ctrl.toPaths(ctrl)).to.eql(paths);
    expect(Ctrl.toPaths(cmd)).to.eql(paths);
  });

  describe('Ctrl.Is', () => {
    const Is = CmdBar.Is;
    const NON = [123, 'abc', [], {}, undefined, null, true, Symbol('foo'), BigInt(0)];

    it('Is.ctrl', () => {
      const ctrl = CmdBar.Ctrl.create();
      NON.forEach((v) => expect(CmdBar.Is.ctrl(v)).to.eql(false));
      expect(Is.ctrl(ctrl)).to.eql(true);

      expect(Is.ctrl({ cmd: CmdBar.Ctrl.toCtrl(ctrl) })).to.eql(false);
      expect(Is.ctrl(ctrl)).to.eql(true);
    });

    it('Is.ref', () => {
      NON.forEach((v) => expect(Is.ref(v)).to.eql(false));
      const { ref } = testSetup();
      expect(Is.ref(ref)).to.eql(true);
    });

    it('Is.paths', () => {
      NON.forEach((v) => expect(Is.paths(v)).to.eql(false));
      expect(Is.paths({ foo: ['one'] })).to.eql(false);
      expect(Is.paths({ cmd: 123, text: 'hello' })).to.eql(false);
      expect(Is.paths(DEFAULTS.paths)).to.eql(true);
    });
  });

  describe('Ctrl.Path', () => {
    const Path = CmdBar.Path;

    it('defaults', () => {
      expect(Path.defaults).to.eql(DEFAULTS.paths);
    });

    it('prepend', () => {
      const res = Path.prepend(['foo']);
      expect(res.text).to.eql(['foo', 'text']);
      expect(res.cmd).to.eql(['foo', 'cmd']);
      expect(res.meta).to.eql(['foo', 'meta']);
    });

    it('resolver', async () => {
      const { transport, ref } = testSetup();
      const paths = Path.defaults;
      const resolve = Path.resolver();

      expect(resolve(transport.current).text).to.eql('');
      expect(resolve(transport.current).cmd.queue).to.eql([]);
      expect(resolve(transport.current).meta).to.eql({ history: [] });

      transport.change((d) => {
        const meta = resolve(transport.current).meta;
        meta.history.push('foo --bar');
        ObjectPath.Mutate.value(d, paths.meta, meta);
        ObjectPath.Mutate.value(d, paths.text, 'hello');
      });
      ref.ctrl.invoke({ text: 'foobar' });
      await Time.wait(0);

      expect(ref.resolve(transport.current).text).to.eql('hello');
      expect(resolve(transport.current).text).to.eql('hello');
      expect(resolve(transport.current).meta).to.eql({ history: ['foo --bar'] });

      const queue = resolve(transport.current).cmd.queue!;
      expect(queue.length).to.eql(1);
      expect(queue[0].name).to.eql('Invoke');
      expect(queue[0].params).to.eql({ text: 'foobar' });
    });
  });
});
