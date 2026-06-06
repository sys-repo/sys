import { Perf } from '../common/u.perf.ts';
import { Is, Json, Path, Process, type t } from './common.ts';
import { repairConcreteRemoteAuthorityDelimiter } from './u.specifier.ts';
import { isRemoteLike } from './u.resolve.loaderAdapter.ts';
import { trace } from './u.resolve.trace.ts';

let checkedDenoInstall = false;
const DENO_BINARY = Deno.build.os === 'windows' ? 'deno.exe' : 'deno';

export async function resolveDeno(id: string, cwd: string): Promise<t.DenoResolved | null> {
  return await resolveDenoWith(id, cwd, { invoke: Process.invoke });
}

export async function resolveDenoWith(
  id: string,
  cwd: string,
  deps: t.ResolveDeps,
): Promise<t.DenoResolved | null> {
  if (id.startsWith('\0')) {
    Perf.sample('transport.resolveDeno', 0 as t.Msecs, {
      id,
      cwd,
      skipped: true,
      reason: 'null-byte',
    }, {
      level: 3,
    });
    trace.resolve('request.skip', { id, cwd, reason: 'null-byte' });
    return null;
  }

  const key = wrangle.requestKey(id, cwd);
  const canonical = wrangle.canonicalKey(key, deps.memo);
  trace.resolve('request', {
    id,
    cwd,
    key,
    canonical,
    canonicalChanged: canonical !== key,
  });

  const settled = deps.memo?.settled.get(canonical);
  if (settled) {
    Perf.log(canonical === key ? 'transport.resolveDeno.settled' : 'transport.resolveDeno.alias', {
      id,
      cwd,
    }, {
      level: 3,
      dedupeKey: canonical === key
        ? `transport.resolveDeno.settled:${canonical}:${cwd}`
        : `transport.resolveDeno.alias:${key}:${canonical}:${cwd}`,
    });
    trace.resolve(canonical === key ? 'hit.settled' : 'hit.alias', {
      id,
      cwd,
      key,
      canonical,
      resolvedId: settled.id,
      kind: settled.kind,
      loader: settled.loader ?? '',
      dependencies: settled.dependencies.length,
    });
    return settled;
  }

  const inflight = deps.memo?.inflight.get(canonical);
  if (inflight) {
    Perf.log('transport.resolveDeno.inflight', { id, cwd }, {
      level: 3,
      dedupeKey: `transport.resolveDeno.inflight:${canonical}:${cwd}`,
    });
    trace.resolve('hit.inflight', { id, cwd, key, canonical });
    return await inflight;
  }

  trace.resolve('miss', { id, cwd, key, canonical });
  const run = (async () => {
    const end = Perf.section('transport.resolveDeno', { id, cwd }, {
      level: 2,
      thresholdMs: 20 as t.Msecs,
    });
    if (!checkedDenoInstall) {
      await ensureDenoInstalled(cwd, deps);
      checkedDenoInstall = true;
    }

    const output = await deps.invoke({
      cmd: DENO_BINARY,
      args: ['info', '--json', id],
      cwd,
      silent: true,
    });
    if (!output.success) {
      const text = output.text.stderr || output.text.stdout || output.toString();
      trace.resolve('result.error', { id, cwd, key, canonical, error: text });
      if (text.includes('Integrity check failed')) throw new Error(text);
      end({ ok: false, success: false });
      return null;
    }

    const parsed = Json.safeParse<t.ResolveInfo>(output.text.stdout);
    if (!parsed.ok || !parsed.data) {
      trace.resolve('result.error', { id, cwd, key, canonical, reason: 'json-parse' });
      end({ ok: false, parsed: false });
      return null;
    }
    const json = parsed.data;
    const actualId = json.roots[0];
    const redirected = json.redirects?.[actualId] ?? actualId;
    const mod = json.modules.find((info) => !isResolveError(info) && info.specifier === redirected);

    if (mod === undefined || isResolveError(mod)) {
      trace.resolve('result.error', {
        id,
        cwd,
        key,
        canonical,
        actualId,
        redirected,
        reason: 'module-not-found',
      });
      end({ ok: false, redirected });
      return null;
    }

    if (isResolveInfoModuleEsm(mod)) {
      const sourceSpecifier = mod.specifier !== id && isRemoteLike(mod.specifier)
        ? mod.specifier
        : undefined;
      const resolved = {
        id: mod.local,
        ...(sourceSpecifier ? { specifier: sourceSpecifier } : {}),
        kind: mod.kind,
        loader: mod.mediaType ?? null,
        dependencies: normalizeDependencies(mod.dependencies, json.modules),
      };
      const aliasKeys = wrangle.aliasKeys({ input: key, actualId, redirected, cwd });
      wrangle.memoizeResolved(deps.memo, {
        canonical,
        input: key,
        actualId,
        redirected,
        cwd,
        resolved,
      });
      trace.resolve('result.resolved', {
        id,
        cwd,
        key,
        canonical,
        actualId,
        redirected,
        moduleSpecifier: mod.specifier,
        resolvedId: resolved.id,
        kind: resolved.kind,
        loader: resolved.loader ?? '',
        dependencies: resolved.dependencies.length,
        aliasKeys,
      });
      end({
        ok: true,
        kind: resolved.kind,
        loader: resolved.loader ?? '',
        dependencies: resolved.dependencies.length,
      });
      return resolved;
    }

    if (isResolveInfoModuleNpm(mod)) {
      const resolved = {
        id: mod.npmPackage,
        kind: mod.kind,
        loader: null,
        dependencies: [] as const,
      };
      const aliasKeys = wrangle.aliasKeys({ input: key, actualId, redirected, cwd });
      wrangle.memoizeResolved(deps.memo, {
        canonical,
        input: key,
        actualId,
        redirected,
        cwd,
        resolved,
      });
      trace.resolve('result.resolved', {
        id,
        cwd,
        key,
        canonical,
        actualId,
        redirected,
        moduleSpecifier: mod.specifier,
        resolvedId: resolved.id,
        kind: resolved.kind,
        dependencies: 0,
        aliasKeys,
      });
      end({ ok: true, kind: resolved.kind, dependencies: 0 });
      return resolved;
    }

    if (isResolveInfoModuleExternal(mod)) {
      trace.resolve('result.external', {
        id,
        cwd,
        key,
        canonical,
        actualId,
        redirected,
        moduleSpecifier: mod.specifier,
      });
      end({ ok: true, kind: mod.kind, external: true });
      return null;
    }
    throw new Error(`Unsupported: ${Json.stringify(mod, 2)}`);
  })();

  if (!deps.memo) return await run;

  deps.memo.inflight.set(canonical, run);
  try {
    return await run;
  } finally {
    deps.memo.inflight.delete(canonical);
  }
}

function isResolveError(
  info: t.ResolveInfoError | t.ResolveInfoModule,
): info is t.ResolveInfoError {
  return 'error' in info && Is.str(info.error);
}

function isResolveInfoModuleEsm(
  info: t.ResolveInfoError | t.ResolveInfoModule,
): info is t.ResolveInfoModuleEsm {
  return !isResolveError(info) && info.kind === 'esm';
}

function isResolveInfoModuleNpm(
  info: t.ResolveInfoError | t.ResolveInfoModule,
): info is t.ResolveInfoModuleNpm {
  return !isResolveError(info) && info.kind === 'npm';
}

function isResolveInfoModuleExternal(
  info: t.ResolveInfoError | t.ResolveInfoModule,
): info is t.ResolveInfoModuleExternal {
  return !isResolveError(info) && info.kind === 'external';
}

function normalizeDependencies(
  dependencies: readonly t.ResolveInfoDependency[] | undefined,
  modules: readonly (t.ResolveInfoModule | t.ResolveInfoError)[],
): readonly t.DenoDependency[] {
  return (dependencies ?? []).map((dependency) => {
    const resolvedSpecifier = dependency.code?.specifier ?? dependency.specifier;
    const mod = modules.find(
      (info) => !isResolveError(info) && info.specifier === resolvedSpecifier,
    );

    if (mod && isResolveInfoModuleEsm(mod)) {
      const sourceSpecifier = mod.specifier !== resolvedSpecifier && isRemoteLike(mod.specifier)
        ? mod.specifier
        : undefined;
      return {
        specifier: dependency.specifier,
        resolvedSpecifier,
        ...(sourceSpecifier ? { sourceSpecifier } : {}),
        localPath: mod.local,
        loader: mod.mediaType ?? null,
      };
    }

    return {
      specifier: dependency.specifier,
      resolvedSpecifier,
    };
  });
}

const wrangle = {
  requestKey(id: string, cwd: string) {
    return Json.stringify([Path.normalize(cwd), repairConcreteRemoteAuthorityDelimiter(id)]);
  },

  canonicalKey(key: string, memo?: t.ResolveMemo) {
    return memo?.alias.get(key) ?? key;
  },

  memoizeResolved(
    memo: t.ResolveMemo | undefined,
    args: {
      canonical: string;
      input: string;
      actualId: string;
      redirected: string;
      cwd: string;
      resolved: t.DenoResolved;
    },
  ) {
    if (!memo) return;
    memo.settled.set(args.canonical, args.resolved);
    for (const key of wrangle.aliasKeys(args)) {
      memo.alias.set(key, args.canonical);
    }
  },

  aliasKeys(args: { input: string; actualId: string; redirected: string; cwd: string }) {
    return [
      ...new Set([
        args.input,
        wrangle.requestKey(args.actualId, args.cwd),
        wrangle.requestKey(args.redirected, args.cwd),
      ]),
    ];
  },
} as const;

async function ensureDenoInstalled(cwd: string, deps: t.ResolveDeps) {
  const res = await deps.invoke({
    cmd: DENO_BINARY,
    args: ['--version'],
    cwd,
    silent: true,
  });
  if (!res.success) {
    const text = res.text.stderr || res.text.stdout || res.toString();
    throw new Error(text || 'Deno binary could not be found. Install Deno to resolve this error.');
  }
}
