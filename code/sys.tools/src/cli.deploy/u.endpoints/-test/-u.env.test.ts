import { describe, expect, it, type t, Yaml } from '../../../-test.ts';
import { resolveEndpointEnvRefs } from '../u.env.ts';

const cwd = '/tmp/sys.tools.deploy.env' as t.StringDir;

describe('resolveEndpointEnvRefs', () => {
  it('does not enter dotenv resolution when the AST has no env refs', async () => {
    const ast = Yaml.parseAst('value: plain\n');
    let calls = 0;

    const res = await resolveEndpointEnvRefs(ast, {
      cwd,
      resolve: async () => {
        calls += 1;
        throw new Error('dotenv resolver should not run');
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
      resolve: async () => {
        calls += 1;
        throw new Error('dotenv resolver should not run');
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
      resolve: async (target) => {
        calls += 1;
        return Yaml.EnvRef.resolveAst(target, { get: () => 'resolved' });
      },
    });

    expect(res.ok).to.eql(true);
    expect(res.refs).to.eql<t.Yaml.EnvRef.Ref[]>([{ path: ['value'], name: 'VALUE' }]);
    expect(calls).to.eql(1);
  });
});
