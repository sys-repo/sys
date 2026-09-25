import { Err, Fs, Is, Path, type t } from './common.ts';

type Manifest = Record<string, unknown>;

export type WorkspaceMember = {
  /** Workspace-relative path exactly as declared by the root manifest. */
  readonly path: t.StringPath;
  /** Canonical absolute directory represented by the declared path. */
  readonly root: t.StringDir;
  /** Absolute manifest path preserving the declared member identity. */
  readonly manifestPath: t.StringPath;
  readonly manifest: Manifest;
};

export type WorkspaceMembers = {
  /** Canonical absolute workspace directory. */
  readonly root: t.StringDir;
  /** Absolute manifest path preserving the caller's workspace-root identity. */
  readonly manifestPath: t.StringPath;
  readonly manifest: Manifest;
  readonly members: readonly WorkspaceMember[];
};

/** Resolve the default Deno manifest beneath a workspace root. */
export async function resolveWorkspaceManifestPath(cwd: t.StringDir): Promise<t.StringPath> {
  const declaredRoot = Fs.resolve(cwd) as t.StringDir;
  await canonicalDir(declaredRoot, 'workspace root');
  return await resolveManifestPath(declaredRoot);
}

/** Load configured workspace members from an authoritative root manifest. */
export async function resolveWorkspaceMembers(
  manifestPath: t.StringPath,
): Promise<WorkspaceMembers> {
  const resolvedManifestPath = Fs.resolve(manifestPath);
  const declaredRoot = Path.dirname(resolvedManifestPath) as t.StringDir;
  const root = await canonicalDir(declaredRoot, 'workspace root');
  const manifest = await readManifest(resolvedManifestPath);
  const paths = workspacePaths(manifest, resolvedManifestPath);
  const members: WorkspaceMember[] = [];

  for (const path of paths) members.push(await resolveMember(root, declaredRoot, path));

  return { root, manifestPath: resolvedManifestPath, manifest, members };
}

async function resolveMember(
  root: t.StringDir,
  declaredRoot: t.StringDir,
  path: string,
): Promise<WorkspaceMember> {
  if (Path.Is.absolute(path)) {
    throw Err.std(`Workspace member path must be relative: ${path}`);
  }

  const candidate = Fs.resolve(declaredRoot, path) as t.StringDir;
  if (candidate === declaredRoot) {
    throw Err.std(`Workspace member path must resolve beneath workspace root: ${path}`);
  }
  if (!Path.Is.within(declaredRoot, candidate)) {
    throw Err.std(`Workspace member path escapes workspace root: ${path}`);
  }

  const memberRoot = await canonicalDir(candidate, `workspace member: ${path}`);
  if (memberRoot === root) {
    throw Err.std(`Workspace member path resolves to workspace root through symlink: ${path}`);
  }
  if (!Path.Is.within(root, memberRoot)) {
    throw Err.std(`Workspace member path escapes workspace root through symlink: ${path}`);
  }

  const manifestPath = await resolveManifestPath(candidate);
  const manifest = await readManifest(manifestPath);
  return { path, root: memberRoot, manifestPath, manifest };
}

async function resolveManifestPath(dir: t.StringDir): Promise<t.StringPath> {
  const json = Fs.join(dir, 'deno.json');
  if (await Fs.exists(json)) return json;

  const jsonc = Fs.join(dir, 'deno.jsonc');
  if (await Fs.exists(jsonc)) return jsonc;

  throw Err.std(`Workspace manifest does not exist: ${json} or ${jsonc}`);
}

async function readManifest(path: t.StringPath): Promise<Manifest> {
  const result = await Fs.readJson<unknown>(path);
  if (!result.ok) {
    const condition = result.exists ? 'is invalid' : 'does not exist';
    throw Err.std(`Workspace manifest ${condition}: ${path}`, { cause: result.error });
  }
  if (!Is.record(result.data)) throw Err.std(`Workspace manifest is invalid: ${path}`);
  return result.data;
}

function workspacePaths(manifest: Manifest, manifestPath: t.StringPath): readonly string[] {
  const workspace = manifest.workspace;
  if (!Is.array<unknown>(workspace) || workspace.length === 0 || !workspace.every(Is.str)) {
    throw Err.std(
      `Workspace manifest member list must contain at least one string path: ${manifestPath}`,
    );
  }
  if (workspace.some((path) => path.trim().length === 0)) {
    throw Err.std(`Workspace member path must not be blank: ${manifestPath}`);
  }
  return workspace;
}

async function canonicalDir(path: t.StringPath, label: string): Promise<t.StringDir> {
  let canonical: string;
  try {
    canonical = await Fs.realPath(path);
  } catch (cause) {
    throw Err.std(`Could not resolve ${label}: ${path}`, { cause });
  }

  const info = await Fs.stat(canonical);
  if (!info?.isDirectory) throw Err.std(`${label} is not a directory: ${path}`);
  return canonical as t.StringDir;
}
