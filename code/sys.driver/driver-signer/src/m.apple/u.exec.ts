import { type t, Err, Process } from './common.ts';
import type { RuntimeExecResult } from './u.run.ts';

export type Invoke = t.Process.Lib['invoke'];
export type RuntimeExecDeps = {
  readonly invoke: Invoke;
  readonly sleep: (ms: t.Msecs) => Promise<void>;
};

const runtimeExecDeps: RuntimeExecDeps = {
  invoke: Process.invoke,
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

export const execStage = async (
  stage: t.AppleSigner.Stage,
  input: t.AppleSigner.RunInput,
  deps: RuntimeExecDeps = runtimeExecDeps,
): Promise<RuntimeExecResult> => {
  if (stage === 'sign') {
    const signArgs: string[] = ['--force'];
    if (input.artifactKind === 'app') signArgs.push('--options', 'runtime');
    signArgs.push('--timestamp', '--sign', input.identity, input.artifactPath);

    return execCommand({ code: 'E_SIGN', cmd: 'codesign', args: signArgs }, deps);
  }

  if (stage === 'notarize') {
    if (input.mode !== 'sign-notarize-verify' || !input.notary) {
      return {
        ok: false,
        code: 'E_NOTARIZE',
        error: Err.std('Apple notarize requires mode `sign-notarize-verify` with notary input.'),
      };
    }

    const zipPath = `${input.artifactPath}.notary.zip`;
    try {
      const archive = await execCommand(
        {
          code: 'E_NOTARIZE',
          cmd: 'ditto',
          args: ['-c', '-k', '--sequesterRsrc', '--keepParent', input.artifactPath, zipPath],
        },
        deps,
      );
      if (!archive.ok) return archive;

      const submit = await execCommandDetail(
        {
          code: 'E_NOTARIZE',
          cmd: 'xcrun',
          args: [
            'notarytool',
            'submit',
            zipPath,
            '--key',
            input.notary.keyP8Path,
            '--key-id',
            input.notary.keyId,
            '--issuer',
            input.notary.issuerId,
            '--wait',
            '--output-format',
            'json',
          ],
        },
        deps,
      );
      if (!submit.ok) return submit;

      const notaryJson = submit.stdout.trim();
      if (input.artifactKind === 'dmg') {
        console.info(`apple.signer: dmg notary json → ${notaryJson}`);
      }

      const accepted = parseNotaryAcceptedStatus(submit.stdout);
      if (!accepted.ok) {
        if (input.artifactKind === 'dmg') {
          const submissionId = parseNotarySubmissionId(submit.stdout);
          if (submissionId) {
            const issueSummary = await fetchNotaryIssueSummary(submissionId, input, deps);
            if (issueSummary) {
              const message = `${accepted.error.message}; issues=${issueSummary}`;
              return {
                ok: false,
                code: 'E_NOTARIZE',
                error: Err.std(message, {
                  cause: {
                    base: accepted.error.cause,
                    submissionId,
                    issueSummary,
                  },
                }),
              };
            }
          }
        }

        return {
          ok: false,
          code: 'E_NOTARIZE',
          error: accepted.error,
        };
      }

      const idValue = accepted.data.id || '<unknown>';
      if (input.artifactKind === 'dmg') {
        console.info(`apple.signer: dmg notary accepted → id=${idValue}`);
      }
      return { ok: true };
    } finally {
      await cleanupNotaryArchive(zipPath, deps);
    }
  }

  if (stage === 'staple') {
    if (input.mode !== 'sign-notarize-verify') {
      return {
        ok: false,
        code: 'E_STAPLE',
        error: Err.std('Apple staple requires mode `sign-notarize-verify`.', {
          cause: { mode: input.mode },
        }),
      };
    }

    return execStapleWithRetry(input, deps);
  }

  if (stage === 'verify') {
    const verifyArgs =
      input.artifactKind === 'dmg'
        ? ['--verify', '--strict', input.artifactPath]
        : ['--verify', '--deep', '--strict', input.artifactPath];
    const verifyCodeSign = await execCommand(
      { code: 'E_VERIFY', cmd: 'codesign', args: verifyArgs },
      deps,
    );
    if (!verifyCodeSign.ok) return verifyCodeSign;

    const spctlArgs =
      input.artifactKind === 'dmg'
        ? [
            '--assess',
            '--type',
            'open',
            '--context',
            'context:primary-signature',
            input.artifactPath,
          ]
        : ['--assess', '--type', 'execute', input.artifactPath];

    return execCommand(
      {
        code: 'E_VERIFY',
        cmd: 'spctl',
        args: spctlArgs,
      },
      deps,
    );
  }

  return {
    ok: false,
    code: 'E_INTERNAL',
    error: Err.std('Apple signer stage executor is not implemented in Step 3.', {
      cause: { stage },
    }),
  };
};

/**
 * Helpers:
 */

type CommandDetailOk = {
  readonly ok: true;
  readonly stdout: string;
};

type CommandDetailFail = {
  readonly ok: false;
  readonly code: t.AppleSigner.ErrorCode;
  readonly error: t.StdError;
};

type CommandDetailResult = CommandDetailOk | CommandDetailFail;

type NotaryAcceptedData = {
  readonly id?: string;
};

type NotaryAcceptedResult =
  | {
      readonly ok: true;
      readonly data: NotaryAcceptedData;
    }
  | {
      readonly ok: false;
      readonly error: t.StdError;
    };

function parseNotarySubmissionId(stdout: string): string | undefined {
  try {
    const raw = JSON.parse(stdout);
    if (!raw || typeof raw !== 'object') return undefined;
    const rec = raw as Record<string, unknown>;
    return typeof rec.id === 'string' ? rec.id : undefined;
  } catch {
    return undefined;
  }
}

function parseNotaryAcceptedStatus(stdout: string): NotaryAcceptedResult {
  let raw: unknown;
  try {
    raw = JSON.parse(stdout);
  } catch {
    return {
      ok: false,
      error: Err.std('Apple notary output was not valid JSON.', {
        cause: { output: stdout.trim() },
      }),
    };
  }

  if (!raw || typeof raw !== 'object') {
    return {
      ok: false,
      error: Err.std('Apple notary JSON output was not an object.', {
        cause: { output: stdout.trim() },
      }),
    };
  }

  const rec = raw as Record<string, unknown>;
  const id = typeof rec.id === 'string' ? rec.id : undefined;
  const statusRaw = typeof rec.status === 'string' ? rec.status : undefined;
  const statusSummaryRaw =
    typeof rec.statusSummary === 'string'
      ? rec.statusSummary
      : typeof rec.message === 'string'
        ? rec.message
        : undefined;
  const statusCodeRaw = rec.statusCode;
  const statusCodeCandidate =
    typeof statusCodeRaw === 'number'
      ? statusCodeRaw
      : typeof statusCodeRaw === 'string' && statusCodeRaw.trim() !== ''
        ? Number(statusCodeRaw)
        : undefined;
  const statusCode =
    typeof statusCodeCandidate === 'number' && Number.isFinite(statusCodeCandidate)
      ? statusCodeCandidate
      : undefined;

  const status = (statusRaw || '').trim().toLowerCase();
  const statusSummary = (statusSummaryRaw || '').trim().toLowerCase();

  const acceptedByStatus = status === 'accepted';
  const acceptedBySummary = statusSummary === 'processing complete' && statusCode === 0;

  if (!acceptedByStatus && !acceptedBySummary) {
    const idValue = id || '<missing>';
    const statusValue = statusRaw || '<missing>';
    const summaryValue = statusSummaryRaw || '<missing>';
    const codeValue = statusCode ?? '<missing>';
    const message =
      'Apple notary submission did not reach Accepted status: ' +
      `id=${idValue} status=${statusValue} statusSummary=${summaryValue} statusCode=${codeValue}`;

    return {
      ok: false,
      error: Err.std(message, {
        cause: {
          id,
          status: statusValue,
          statusSummary: summaryValue,
          statusCode: codeValue,
          raw,
        },
      }),
    };
  }

  return {
    ok: true,
    data: { id },
  };
}

async function fetchNotaryIssueSummary(
  submissionId: string,
  input: t.AppleSigner.RunInputSignNotarizeVerify,
  deps: RuntimeExecDeps,
): Promise<string | undefined> {
  const logRes = await execCommandDetail(
    {
      code: 'E_NOTARIZE',
      cmd: 'xcrun',
      args: [
        'notarytool',
        'log',
        submissionId,
        '--key',
        input.notary.keyP8Path,
        '--key-id',
        input.notary.keyId,
        '--issuer',
        input.notary.issuerId,
        '--output-format',
        'json',
      ],
    },
    deps,
  );
  if (!logRes.ok) return undefined;

  try {
    const raw = JSON.parse(logRes.stdout);
    if (!raw || typeof raw !== 'object') return undefined;
    const rec = raw as Record<string, unknown>;
    const issuesRaw = rec.issues;
    if (!Array.isArray(issuesRaw) || issuesRaw.length === 0) return undefined;

    const chunks: string[] = [];
    for (const issue of issuesRaw.slice(0, 5)) {
      if (!issue || typeof issue !== 'object') continue;
      const i = issue as Record<string, unknown>;
      const message = typeof i.message === 'string' ? i.message : '<message-missing>';
      const path = typeof i.path === 'string' ? i.path : '<path-missing>';
      const severity = typeof i.severity === 'string' ? i.severity : '<severity-missing>';
      chunks.push(`${severity}:${path}:${message}`);
    }
    return chunks.length > 0 ? chunks.join(' | ') : undefined;
  } catch {
    return undefined;
  }
}

async function execCommandDetail(
  args: {
    readonly code: t.AppleSigner.ErrorCode;
    readonly cmd: string;
    readonly args: readonly string[];
  },
  deps: RuntimeExecDeps,
): Promise<CommandDetailResult> {
  const { code, cmd } = args;

  try {
    const res = await deps.invoke({
      cmd,
      args: [...args.args],
      silent: true,
    });

    if (res.success) {
      return {
        ok: true,
        stdout: res.text.stdout,
      };
    }

    const stderr = res.text.stderr.trim();
    const stdout = res.text.stdout.trim();
    const detail = [stderr, stdout].find((value) => value.length > 0) ?? `exit code ${res.code}`;
    const joinedArgs = args.args.join(' ');
    const message = `Apple signer command failed: ${cmd} ${joinedArgs} → ${detail}`;

    return {
      ok: false,
      code,
      error: Err.std(message),
    };
  } catch (cause) {
    const detail =
      cause instanceof Error
        ? `${cause.name}: ${cause.message}`
        : `Unknown error (${typeof cause})`;

    return {
      ok: false,
      code,
      error: Err.std(`Apple signer command failed: ${cmd} → ${detail}`),
    };
  }
}

async function execCommand(
  args: {
    readonly code: t.AppleSigner.ErrorCode;
    readonly cmd: string;
    readonly args: readonly string[];
  },
  deps: RuntimeExecDeps,
): Promise<RuntimeExecResult> {
  const { code, cmd } = args;

  try {
    const res = await deps.invoke({
      cmd,
      args: [...args.args],
      silent: true,
    });

    if (res.success) return { ok: true };

    const stderr = res.text.stderr.trim();
    const stdout = res.text.stdout.trim();
    const detail = [stderr, stdout].find((value) => value.length > 0) ?? `exit code ${res.code}`;
    const joinedArgs = args.args.join(' ');
    const message = `Apple signer command failed: ${cmd} ${joinedArgs} → ${detail}`;

    return {
      ok: false,
      code,
      error: Err.std(message),
    };
  } catch (cause) {
    const detail =
      cause instanceof Error
        ? `${cause.name}: ${cause.message}`
        : `Unknown error (${typeof cause})`;
    return {
      ok: false,
      code,
      error: Err.std(`Apple signer command failed: ${cmd} → ${detail}`),
    };
  }
}

async function cleanupNotaryArchive(zipPath: string, deps: RuntimeExecDeps): Promise<void> {
  try {
    await deps.invoke({
      cmd: 'rm',
      args: ['-f', zipPath],
      silent: true,
    });
  } catch {
    // ignore cleanup failures
  }
}

async function execStapleWithRetry(
  input: t.AppleSigner.RunInput,
  deps: RuntimeExecDeps,
): Promise<RuntimeExecResult> {
  const maxAttempts = input.artifactKind === 'dmg' ? 8 : 1;
  const baseDelayMs = 10000;
  const maxDelayMs = 30000;
  const initialDelayMs = input.artifactKind === 'dmg' ? 30000 : 0;

  if (initialDelayMs > 0) {
    console.info(`apple.signer: dmg staple grace wait → ${initialDelayMs}ms`);
    await deps.sleep(initialDelayMs);
  }

  let attempt = 1;

  while (true) {
    const stapleRes = await execCommand(
      {
        code: 'E_STAPLE',
        cmd: 'xcrun',
        args: ['stapler', 'staple', input.artifactPath],
      },
      deps,
    );

    let res = stapleRes;
    if (stapleRes.ok) {
      res = await execCommand(
        {
          code: 'E_STAPLE',
          cmd: 'xcrun',
          args: ['stapler', 'validate', input.artifactPath],
        },
        deps,
      );
    }

    if (res.ok) return res;

    if (attempt >= maxAttempts || !shouldRetryStaple(res)) {
      return res;
    }

    const expFactor = 2 ** (attempt - 1);
    const delay = Math.min(baseDelayMs * expFactor, maxDelayMs);
    console.info(`apple.signer: staple retry ${attempt}/${maxAttempts} → wait ${delay}ms`);
    attempt += 1;
    await deps.sleep(delay);
  }
}

function shouldRetryStaple(res: RuntimeExecResult): boolean {
  if (res.ok) return false;
  const msg = (res.error.message || '').toLowerCase();
  return (
    msg.includes('record not found') ||
    msg.includes('cloudkit query') ||
    msg.includes('could not find base64 encoded ticket') ||
    msg.includes('error 65')
  );
}
