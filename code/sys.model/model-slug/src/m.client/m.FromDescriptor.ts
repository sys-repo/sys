import type { t } from './common.ts';
import { Url } from './common.ts';
import { Bundle } from './m.io.Bundle.ts';
import { FileContent } from './m.io.FileContent.ts';
import { Assets } from './m.io.timeline.Assets.ts';
import { Playback } from './m.io.timeline.Playback.ts';
import { Tree } from './m.io.Tree.ts';

export const FromDescriptor: t.SlugClientFromDescriptorLib = {
  make,
};

function make(args: t.SlugClientFromDescriptorArgs) {
  const resolved = resolveDescriptor(args.descriptor, args.kind, args.docid);
  if (!resolved.ok) return resolved;

  const descriptor = resolved.value;
  const baseUrl = applyBasePath(args.baseUrl, descriptor.basePath);
  const baseHref = baseUrl;
  const layout = descriptorLayout(descriptor);

  const withOptions = <T extends t.SlugLoadOptions>(options?: T): T => {
    const next = {
      ...options,
      baseHref: options?.baseHref ?? baseHref,
      layout: {
        ...(layout ?? {}),
        ...(options?.layout ?? {}),
      },
    };
    return next as T;
  };

  const client: t.SlugClientDescriptor = {
    kind: descriptor.kind,
    docid: descriptor.docid,
    baseUrl,
    baseHref,
    layout,
    Tree: {
      load: (options) => Tree.load(baseUrl, descriptor.docid, withOptions(options)),
    },
    Assets: {
      load: (options) => Assets.load(baseUrl, descriptor.docid, withOptions(options)),
    },
    Playback: {
      load: (options) => Playback.load(baseUrl, descriptor.docid, withOptions(options)),
    },
    Bundle: {
      load: (options) => Bundle.load(baseUrl, descriptor.docid, withOptions(options)),
    },
    FileContent: {
      index: (options) => FileContent.index(baseUrl, descriptor.docid, withOptions(options)),
      get: (hash, options) => FileContent.get(baseUrl, hash, withOptions(options)),
    },
  };

  return {
    ok: true,
    value: client,
  } satisfies t.SlugClientResult<t.SlugClientDescriptor>;
}

function applyBasePath(baseUrl: t.StringUrl, basePath?: t.StringPath): t.StringUrl {
  if (!basePath) return baseUrl;
  return Url.parse(baseUrl).join(basePath);
}

function resolveDescriptor(
  descriptor: t.BundleDescriptor | t.BundleDescriptorDoc,
  kind?: t.BundleDescriptorKind,
  docid?: t.StringId,
): t.SlugClientResult<t.BundleDescriptor> {
  if (isDescriptorDoc(descriptor)) {
    const matches = descriptor.bundles.filter((item) => {
      if (kind && item.kind !== kind) return false;
      if (docid && item.docid !== docid) return false;
      return true;
    });

    if (matches.length === 1) return { ok: true, value: matches[0] };

    if (!kind && !docid && descriptor.bundles.length === 1) {
      return { ok: true, value: descriptor.bundles[0] };
    }

    if (matches.length === 0) {
      return {
        ok: false,
        error: {
          kind: 'schema',
          message: 'Bundle descriptor not found for selection.',
        },
      };
    }

    return {
      ok: false,
      error: {
        kind: 'schema',
        message: 'Bundle descriptor selection is ambiguous.',
      },
    };
  }

  if (kind && descriptor.kind !== kind) {
    return {
      ok: false,
      error: {
        kind: 'schema',
        message: `Bundle descriptor kind mismatch. Expected: ${kind}. Got: ${descriptor.kind}`,
      },
    };
  }

  if (docid && descriptor.docid !== docid) {
    return {
      ok: false,
      error: {
        kind: 'schema',
        message: `Bundle descriptor docid mismatch. Expected: ${docid}. Got: ${descriptor.docid}`,
      },
    };
  }

  return { ok: true, value: descriptor };
}

function isDescriptorDoc(
  input: t.BundleDescriptor | t.BundleDescriptorDoc,
): input is t.BundleDescriptorDoc {
  return Array.isArray((input as t.BundleDescriptorDoc).bundles);
}

function descriptorLayout(descriptor: t.BundleDescriptor): t.SlugClientLayout | undefined {
  if (descriptor.kind === 'slug-tree:fs') {
    return {
      manifestsDir: descriptor.layout?.manifestsDir,
      contentDir: descriptor.layout?.contentDir,
    };
  }

  if (descriptor.kind === 'slug-tree:media:seq') {
    return {
      manifestsDir: descriptor.layout?.manifestsDir,
    };
  }

  return undefined;
}
