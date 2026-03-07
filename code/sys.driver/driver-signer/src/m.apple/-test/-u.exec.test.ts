import { describe, expect, it } from '../../-test.ts';
import type { t } from '../common.ts';
import { execStage } from '../u.exec.ts';

const TEST_IDENTITY = 'Developer ID Application: Example Org (TEAMID1234)';

describe('@sys/driver-signer/apple: u.exec', () => {
  type ProcInvokeArgs = t.ProcInvokeArgs;
  type ProcOutput = t.ProcOutput;
  const sleep = async (_ms: number) => {};

  it('sign stage → calls codesign --force --sign <identity> <artifactPath>', async () => {
    const calls: ProcInvokeArgs[] = [];
    const invoke = async (input: ProcInvokeArgs): Promise<ProcOutput> => {
      calls.push(input);
      return procOut({ success: true, code: 0 });
    };

    const res = await execStage('sign', signInput(), { invoke, sleep });
    expect(res.ok).to.eql(true);

    expect(calls.length).to.eql(1);
    expect(calls[0].cmd).to.eql('codesign');
    expect(calls[0].silent).to.eql(true);
    expect(calls[0].args).to.eql([
      '--force',
      '--options',
      'runtime',
      '--timestamp',
      '--sign',
      TEST_IDENTITY,
      '/tmp/System.app',
    ]);
  });

  it('sign stage (dmg) → calls codesign without runtime option', async () => {
    const calls: ProcInvokeArgs[] = [];
    const invoke = async (input: ProcInvokeArgs): Promise<ProcOutput> => {
      calls.push(input);
      return procOut({ success: true, code: 0 });
    };

    const res = await execStage('sign', dmgInput('sign-verify'), { invoke, sleep });
    expect(res.ok).to.eql(true);

    expect(calls.length).to.eql(1);
    expect(calls[0].cmd).to.eql('codesign');
    expect(calls[0].silent).to.eql(true);
    expect(calls[0].args).to.eql([
      '--force',
      '--timestamp',
      '--sign',
      TEST_IDENTITY,
      '/tmp/System.dmg',
    ]);
  });

  it('notarize stage → calls ditto zip and xcrun notarytool submit --wait in order', async () => {
    const calls: ProcInvokeArgs[] = [];
    const invoke = async (input: ProcInvokeArgs): Promise<ProcOutput> => {
      calls.push(input);
      if (input.cmd === 'xcrun') {
        return procOut({ success: true, code: 0, stdout: '{"id":"SUB-A1","status":"Accepted"}' });
      }
      return procOut({ success: true, code: 0 });
    };

    const res = await execStage('notarize', notarizeInput(), { invoke, sleep });
    expect(res.ok).to.eql(true);

    expect(calls.map((call) => call.cmd)).to.eql(['ditto', 'xcrun', 'rm']);
    expect(calls[0].silent).to.eql(true);
    expect(calls[1].silent).to.eql(true);
    expect(calls[2].silent).to.eql(true);
    expect(calls[0].args).to.eql([
      '-c',
      '-k',
      '--sequesterRsrc',
      '--keepParent',
      '/tmp/System.app',
      '/tmp/System.app.notary.zip',
    ]);
    expect(calls[1].args).to.eql([
      'notarytool',
      'submit',
      '/tmp/System.app.notary.zip',
      '--key',
      '/tmp/AuthKey_K123456789.p8',
      '--key-id',
      'K123456789',
      '--issuer',
      '00000000-0000-0000-0000-000000000000',
      '--wait',
      '--output-format',
      'json',
    ]);
    expect(calls[2].args).to.eql(['-f', '/tmp/System.app.notary.zip']);
  });

  it('notarize stage (dmg) → calls xcrun notarytool submit --wait directly', async () => {
    const calls: ProcInvokeArgs[] = [];
    const invoke = async (input: ProcInvokeArgs): Promise<ProcOutput> => {
      calls.push(input);
      return procOut({ success: true, code: 0, stdout: '{"id":"SUB-1","status":"Accepted"}' });
    };

    const res = await execStage('notarize', dmgInput('sign-notarize-verify'), { invoke, sleep });
    expect(res.ok).to.eql(true);

    expect(calls.map((call) => call.cmd)).to.eql(['ditto', 'xcrun', 'rm']);
    expect(calls[0].silent).to.eql(true);
    expect(calls[1].silent).to.eql(true);
    expect(calls[2].silent).to.eql(true);
    expect(calls[0].args).to.eql([
      '-c',
      '-k',
      '--sequesterRsrc',
      '--keepParent',
      '/tmp/System.dmg',
      '/tmp/System.dmg.notary.zip',
    ]);
    expect(calls[1].args).to.eql([
      'notarytool',
      'submit',
      '/tmp/System.dmg.notary.zip',
      '--key',
      '/tmp/AuthKey_K123456789.p8',
      '--key-id',
      'K123456789',
      '--issuer',
      '00000000-0000-0000-0000-000000000000',
      '--wait',
      '--output-format',
      'json',
    ]);
    expect(calls[2].args).to.eql(['-f', '/tmp/System.dmg.notary.zip']);
  });

  it('notarize stage (dmg) with non-accepted status → E_NOTARIZE', async () => {
    const invoke = async (_input: ProcInvokeArgs): Promise<ProcOutput> => {
      return procOut({ success: true, code: 0, stdout: '{"id":"SUB-2","status":"In Progress"}' });
    };

    const res = await execStage('notarize', dmgInput('sign-notarize-verify'), { invoke, sleep });
    expect(res.ok).to.eql(false);
    if (res.ok) throw new Error('Expected failure result.');
    expect(res.code).to.eql('E_NOTARIZE');
    expect(res.error.message).to.include('id=SUB-2');
    expect(res.error.message).to.include('status=In Progress');
  });

  it('notarize stage (dmg) with processing complete + statusCode 0 → accepted', async () => {
    const invoke = async (_input: ProcInvokeArgs): Promise<ProcOutput> => {
      return procOut({
        success: true,
        code: 0,
        stdout: '{"id":"SUB-3","message":"Processing complete","statusCode":0}',
      });
    };

    const res = await execStage('notarize', dmgInput('sign-notarize-verify'), { invoke, sleep });
    expect(res.ok).to.eql(true);
  });

  it('notarize stage (dmg) with processing complete + non-zero statusCode → E_NOTARIZE', async () => {
    const invoke = async (_input: ProcInvokeArgs): Promise<ProcOutput> => {
      return procOut({
        success: true,
        code: 0,
        stdout: '{"id":"SUB-4","message":"Processing complete","statusCode":1}',
      });
    };

    const res = await execStage('notarize', dmgInput('sign-notarize-verify'), { invoke, sleep });
    expect(res.ok).to.eql(false);
    if (res.ok) throw new Error('Expected failure result.');
    expect(res.code).to.eql('E_NOTARIZE');
    expect(res.error.message).to.include('id=SUB-4');
    expect(res.error.message).to.include('statusSummary=Processing complete');
    expect(res.error.message).to.include('statusCode=1');
  });

  it('notarize stage (dmg) invalid + submission id → appends notary log issue summary', async () => {
    const calls: ProcInvokeArgs[] = [];
    const invoke = async (input: ProcInvokeArgs): Promise<ProcOutput> => {
      calls.push(input);
      if (input.cmd === 'xcrun' && input.args[1] === 'submit') {
        return procOut({
          success: true,
          code: 0,
          stdout: '{"id":"SUB-ISSUE","status":"Invalid","message":"Processing complete"}',
        });
      }
      if (input.cmd === 'xcrun' && input.args[1] === 'log') {
        return procOut({
          success: true,
          code: 0,
          stdout:
            '{"issues":[{"severity":"error","path":"System.dmg","message":"The binary is not signed with a valid Developer ID certificate."}]}',
        });
      }
      return procOut({ success: true, code: 0 });
    };

    const res = await execStage('notarize', dmgInput('sign-notarize-verify'), { invoke, sleep });
    expect(res.ok).to.eql(false);
    if (res.ok) throw new Error('Expected failure result.');
    expect(res.code).to.eql('E_NOTARIZE');
    expect(res.error.message).to.include('issues=error:System.dmg:The binary is not signed');
    expect(calls.map((call) => call.cmd)).to.eql(['ditto', 'xcrun', 'xcrun', 'rm']);
    expect(calls[2].args).to.eql([
      'notarytool',
      'log',
      'SUB-ISSUE',
      '--key',
      '/tmp/AuthKey_K123456789.p8',
      '--key-id',
      'K123456789',
      '--issuer',
      '00000000-0000-0000-0000-000000000000',
      '--output-format',
      'json',
    ]);
  });

  it('staple stage → calls xcrun stapler staple + validate', async () => {
    const calls: ProcInvokeArgs[] = [];
    const invoke = async (input: ProcInvokeArgs): Promise<ProcOutput> => {
      calls.push(input);
      return procOut({ success: true, code: 0 });
    };

    const res = await execStage('staple', notarizeInput(), { invoke, sleep });
    expect(res.ok).to.eql(true);

    expect(calls.length).to.eql(2);
    expect(calls.map((call) => call.cmd)).to.eql(['xcrun', 'xcrun']);
    expect(calls[0].silent).to.eql(true);
    expect(calls[1].silent).to.eql(true);
    expect(calls[0].args).to.eql(['stapler', 'staple', '/tmp/System.app']);
    expect(calls[1].args).to.eql(['stapler', 'validate', '/tmp/System.app']);
  });

  it('staple stage (dmg) → calls xcrun stapler staple + validate after grace wait', async () => {
    const calls: ProcInvokeArgs[] = [];
    const sleeps: number[] = [];
    const invoke = async (input: ProcInvokeArgs): Promise<ProcOutput> => {
      calls.push(input);
      return procOut({ success: true, code: 0 });
    };
    const sleep = async (ms: number) => {
      sleeps.push(ms);
    };

    const res = await execStage('staple', dmgInput('sign-notarize-verify'), { invoke, sleep });
    expect(res.ok).to.eql(true);

    expect(calls.length).to.eql(2);
    expect(calls.map((call) => call.cmd)).to.eql(['xcrun', 'xcrun']);
    expect(calls[0].silent).to.eql(true);
    expect(calls[1].silent).to.eql(true);
    expect(calls[0].args).to.eql(['stapler', 'staple', '/tmp/System.dmg']);
    expect(calls[1].args).to.eql(['stapler', 'validate', '/tmp/System.dmg']);
    expect(sleeps).to.eql([30000]);
  });

  it('verify stage → calls codesign verify and spctl assess in order', async () => {
    const calls: ProcInvokeArgs[] = [];
    const invoke = async (input: ProcInvokeArgs): Promise<ProcOutput> => {
      calls.push(input);
      return procOut({ success: true, code: 0 });
    };

    const res = await execStage('verify', signInput(), { invoke, sleep });
    expect(res.ok).to.eql(true);

    expect(calls.map((call) => call.cmd)).to.eql(['codesign', 'spctl']);
    expect(calls[0].silent).to.eql(true);
    expect(calls[1].silent).to.eql(true);
    expect(calls[0].args).to.eql(['--verify', '--deep', '--strict', '/tmp/System.app']);
    expect(calls[1].args).to.eql(['--assess', '--type', 'execute', '/tmp/System.app']);
  });

  it('verify stage (dmg) → calls codesign verify and spctl open assess in order', async () => {
    const calls: ProcInvokeArgs[] = [];
    const invoke = async (input: ProcInvokeArgs): Promise<ProcOutput> => {
      calls.push(input);
      return procOut({ success: true, code: 0 });
    };

    const res = await execStage('verify', dmgInput('sign-verify'), { invoke, sleep });
    expect(res.ok).to.eql(true);

    expect(calls.map((call) => call.cmd)).to.eql(['codesign', 'spctl']);
    expect(calls[0].silent).to.eql(true);
    expect(calls[1].silent).to.eql(true);
    expect(calls[0].args).to.eql(['--verify', '--strict', '/tmp/System.dmg']);
    expect(calls[1].args).to.eql([
      '--assess',
      '--type',
      'open',
      '--context',
      'context:primary-signature',
      '/tmp/System.dmg',
    ]);
  });

  it('sign stage failure → maps to E_SIGN', async () => {
    const invoke = async (_input: ProcInvokeArgs): Promise<ProcOutput> => {
      return procOut({ success: false, code: 1, stderr: 'codesign failed\n' });
    };

    const res = await execStage('sign', signInput(), { invoke, sleep });
    expect(res.ok).to.eql(false);
    if (res.ok) throw new Error('Expected failure result.');
    expect(res.code).to.eql('E_SIGN');
  });

  it('verify stage failure → maps to E_VERIFY', async () => {
    const invoke = async (input: ProcInvokeArgs): Promise<ProcOutput> => {
      if (input.cmd === 'spctl') {
        return procOut({ success: false, code: 3, stderr: 'rejected\n' });
      }
      return procOut({ success: true, code: 0 });
    };

    const res = await execStage('verify', signInput(), { invoke, sleep });
    expect(res.ok).to.eql(false);
    if (res.ok) throw new Error('Expected failure result.');
    expect(res.code).to.eql('E_VERIFY');
  });

  it('notarize stage failure → maps to E_NOTARIZE', async () => {
    const calls: ProcInvokeArgs[] = [];
    const invoke = async (input: ProcInvokeArgs): Promise<ProcOutput> => {
      calls.push(input);
      if (input.cmd === 'xcrun') {
        return procOut({ success: false, code: 2, stderr: 'notarytool failed\n' });
      }
      return procOut({ success: true, code: 0 });
    };

    const res = await execStage('notarize', notarizeInput(), { invoke, sleep });
    expect(res.ok).to.eql(false);
    if (res.ok) throw new Error('Expected failure result.');
    expect(res.code).to.eql('E_NOTARIZE');
    expect(calls.map((call) => call.cmd)).to.eql(['ditto', 'xcrun', 'rm']);
  });

  it('staple stage failure → maps to E_STAPLE', async () => {
    const invoke = async (_input: ProcInvokeArgs): Promise<ProcOutput> => {
      return procOut({ success: false, code: 4, stderr: 'staple failed\n' });
    };

    const res = await execStage('staple', notarizeInput(), { invoke, sleep });
    expect(res.ok).to.eql(false);
    if (res.ok) throw new Error('Expected failure result.');
    expect(res.code).to.eql('E_STAPLE');
  });

  it('staple stage with unsupported mode → E_STAPLE', async () => {
    const invoke = async (_input: ProcInvokeArgs): Promise<ProcOutput> => {
      throw new Error('invoke should not be called for unsupported mode');
    };

    const res = await execStage('staple', signInput(), { invoke, sleep });
    expect(res.ok).to.eql(false);
    if (res.ok) throw new Error('Expected failure result.');
    expect(res.code).to.eql('E_STAPLE');
  });

  it('notarize stage with missing notary input → E_NOTARIZE', async () => {
    const invoke = async (_input: ProcInvokeArgs): Promise<ProcOutput> => {
      throw new Error('invoke should not be called without notary input');
    };

    const res = await execStage(
      'notarize',
      {
        mode: 'sign-notarize-verify',
        artifactKind: 'app',
        artifactPath: '/tmp/System.app',
        identity: TEST_IDENTITY,
      } as t.AppleSigner.RunInput,
      { invoke, sleep },
    );
    expect(res.ok).to.eql(false);
    if (res.ok) throw new Error('Expected failure result.');
    expect(res.code).to.eql('E_NOTARIZE');
  });

  it('unsupported stage (read) → maps to E_INTERNAL', async () => {
    const invoke = async (_input: ProcInvokeArgs): Promise<ProcOutput> => {
      throw new Error('invoke should not be called for unsupported stage');
    };

    const res = await execStage('read', signInput(), { invoke, sleep });
    expect(res.ok).to.eql(false);
    if (res.ok) throw new Error('Expected failure result.');
    expect(res.code).to.eql('E_INTERNAL');
  });

  it('staple stage (dmg) retries transient ticket propagation errors then succeeds', async () => {
    const calls: ProcInvokeArgs[] = [];
    const sleeps: number[] = [];
    let attempt = 0;
    const invoke = async (input: ProcInvokeArgs): Promise<ProcOutput> => {
      calls.push(input);
      attempt += 1;
      if (attempt < 3) {
        return procOut({
          success: false,
          code: 65,
          stderr:
            'CloudKit query failed due to "Record not found". Could not find base64 encoded ticket in response.',
        });
      }
      return procOut({ success: true, code: 0 });
    };
    const sleep = async (ms: number) => {
      sleeps.push(ms);
    };

    const res = await execStage('staple', dmgInput('sign-notarize-verify'), { invoke, sleep });
    expect(res.ok).to.eql(true);
    expect(calls.length).to.eql(4);
    expect(calls.map((call) => call.args)).to.eql([
      ['stapler', 'staple', '/tmp/System.dmg'],
      ['stapler', 'staple', '/tmp/System.dmg'],
      ['stapler', 'staple', '/tmp/System.dmg'],
      ['stapler', 'validate', '/tmp/System.dmg'],
    ]);
    expect(sleeps).to.eql([30000, 10000, 20000]);
  });
});

/**
 * Helpers:
 */
function signInput(): t.AppleSigner.RunInput {
  return {
    mode: 'sign-verify',
    artifactKind: 'app',
    artifactPath: '/tmp/System.app',
    identity: TEST_IDENTITY,
  };
}

function notarizeInput(): t.AppleSigner.RunInput {
  return {
    mode: 'sign-notarize-verify',
    artifactKind: 'app',
    artifactPath: '/tmp/System.app',
    identity: TEST_IDENTITY,
    notary: {
      keyId: 'K123456789',
      issuerId: '00000000-0000-0000-0000-000000000000',
      keyP8Path: '/tmp/AuthKey_K123456789.p8',
    },
  };
}

function dmgInput(mode: t.AppleSigner.Mode): t.AppleSigner.RunInput {
  if (mode === 'sign-notarize-verify') {
    return {
      ...notarizeInput(),
      artifactKind: 'dmg',
      artifactPath: '/tmp/System.dmg',
    };
  }

  return {
    mode,
    artifactKind: 'dmg',
    artifactPath: '/tmp/System.dmg',
    identity: TEST_IDENTITY,
  };
}

function procOut(args: {
  readonly success: boolean;
  readonly code: number;
  readonly stdout?: string;
  readonly stderr?: string;
}): t.ProcOutput {
  const stdoutText = args.stdout ?? '';
  const stderrText = args.stderr ?? '';
  const stdout = new TextEncoder().encode(stdoutText);
  const stderr = new TextEncoder().encode(stderrText);

  const text = { stdout: stdoutText, stderr: stderrText };

  return {
    code: args.code,
    success: args.success,
    signal: null,
    stdout,
    stderr,
    text,
    toString() {
      return args.success ? text.stdout : text.stderr;
    },
  };
}
