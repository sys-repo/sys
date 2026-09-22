import { describe, expect, it, type t, Yaml } from '../../../-test.ts';
import { resolveEndpointEnvRefs } from '../u.env.ts';

const cwd: t.StringDir = '/tmp/sys.tools.deploy.env';

describe('resolveEndpointEnvRefs', () => {
  it('does not enter dotenv resolution when the AST has no env refs', async () => {
    const ast = Yaml.parseAst('value: plain\n');
    let calls = 0;

    const res = await resolveEndpointEnvRefs(ast, {
      cwd,
      resolve() {
        calls += 1;
        return Promise.reject(new Error('dotenv resolver should not run'));
      },
    });

    expect(res.ok).to.eql(true);
    expect(res.refs).to.eql([]);
    expect(calls).to.eql(0);
  });

  it('rejects malformed refs without entering dotenv resolution', async () => {
    const ast = Yaml.parseAst('value: prefix-${env:VALUE}\n');
    let calls = 0;

    const res = await resolveEndpointEnvRefs(ast, {
      cwd,
      resolve() {
        calls += 1;
        return Promise.reject(new Error('dotenv resolver should not run'));
      },
    });

    expect(res.ok).to.eql(false);
    expect(calls).to.eql(0);
    if (!res.ok) {
      expect(res.errors[0]?.message).to.eql(
        'value contains unsupported env ref syntax: prefix-${env:VALUE}',
      );
    }
  });

  it('delegates valid refs to the canonical dotenv resolver', async () => {
    const ast = Yaml.parseAst('value: ${env:VALUE}\n');
    let calls = 0;

    const res = await resolveEndpointEnvRefs(ast, {
      cwd,
      resolve(target, options) {
        calls += 1;
        expect(options).to.eql({ cwd, search: 'upward', nonEmpty: true });
        return Promise.resolve(Yaml.EnvRef.resolveAst(target, {
          get: () => 'resolved',
          nonEmpty: options.nonEmpty,
        }));
      },
    });

    expect(res.ok).to.eql(true);
    expect(res.refs).to.eql<t.Yaml.EnvRef.Ref[]>([{ path: ['value'], name: 'VALUE' }]);
    expect(Yaml.toJS(ast).data).to.eql({ value: 'resolved' });
    expect(calls).to.eql(1);
  });
});
