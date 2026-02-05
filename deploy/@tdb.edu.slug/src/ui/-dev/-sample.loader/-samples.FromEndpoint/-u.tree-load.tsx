import { type t, Color, css, Is, KeyValue, SlugClient, Url } from './-common.ts';

export const SampleTree: t.FetchSample = {
  label() {
    const theme = Color.theme();
    const styles = {
      base: css({
        backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
        color: Color.MAGENTA,
        padding: 12,
        borderRadius: 4,
        border: `dashed 1px ${Color.alpha(theme.fg, 0.1)}`,
      }),
      label: css({ fontFamily: 'monospace', fontSize: 11, fontWeight: 600 }),
      info: css({ MarginX: 10, MarginY: 8 }),
    };
    return (
      <div className={styles.base.class}>
        <div className={styles.label.class}>{`FromEndpoint.Tree.load`}</div>

        <KeyValue.UI
          mono={true}
          items={KeyValue.fromObject({ foo: 123, bar: 'baz' })}
          style={styles.info}
        />
      </div>
    );
  },

  /**
   * Load slug-tree and file-content (via ref).
   */
  async run(e) {
    const basePath = 'kb';
    const origin = e.origin.cdn.default;
    const manifestsDir = '-manifests';
    const docid = 'kb';

    const baseUrl = Url.parse(origin).join(basePath);
    const FromEndpoint = SlugClient.FromEndpoint;
    const tree = await FromEndpoint.Tree.load(baseUrl, docid, { layout: { manifestsDir } });
    if (!tree.ok) return e.result(tree);

    const ref = findTreeRef(tree.value.tree);
    if (!ref) {
      return e.result({
        ok: false,
        error: { kind: 'schema', message: 'Missing ref in slug-tree.' },
      });
    }

    const content = await loadContentFromRef({ baseUrl, docid, manifestsDir, ref });
    if (!content.ok) return e.result(content);

    return e.result({
      ok: true,
      value: {
        tree: tree.value,
        ref,
        hash: content.value.hash,
        content: content.value.content,
      },
    });
  },
};

function findTreeRef(tree: readonly t.SlugTreeItem[]): string | undefined {
  for (const item of tree) {
    if (Is.string((item as { ref?: unknown }).ref)) {
      return (item as { ref: string }).ref;
    }
    if (item.slugs) {
      const found = findTreeRef(item.slugs);
      if (found) return found;
    }
  }
  return undefined;
}

async function loadContentFromRef(args: {
  baseUrl: t.StringUrl;
  docid: t.StringId;
  manifestsDir: t.StringDir;
  ref: string;
}): Promise<t.SlugClientResult<{ hash: string; content: t.SlugFileContentDoc }>> {
  const index = await SlugClient.FromEndpoint.FileContent.index(args.baseUrl, args.docid, {
    layout: { manifestsDir: args.manifestsDir },
  });
  if (!index.ok) return index;

  const entry = index.value.entries.find((item) => {
    if (item.frontmatter?.ref === args.ref) return true;
    if (item.path === args.ref) return true;
    return false;
  });
  const hash = entry?.hash;
  if (!hash) {
    return {
      ok: false,
      error: { kind: 'schema', message: `Missing hash for ref: ${args.ref}` },
    };
  }

  const content = await SlugClient.FromEndpoint.FileContent.get(args.baseUrl, hash, {
    layout: { contentDir: 'content' },
  });
  if (!content.ok) return content;

  return { ok: true, value: { hash, content: content.value } };
}
