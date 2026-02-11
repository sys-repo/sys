import React from 'react';
import { type t, KeyValue, ObjectView, Obj } from './common.ts';
import { toFrontmatter } from './u.data.ts';

type Args = {
  readonly file?: t.FileContentData;
  readonly loading: boolean;
  readonly theme?: t.CommonTheme;
};

export function renderFileMain(args: Args) {
  const file = args.file;
  if (!file) return undefined;
  const frontmatter = toFrontmatter(file.content);
  return (
    <div>
      <KeyValue.UI
        theme={args.theme}
        items={[
          { kind: 'title', v: 'File Content' },
          { k: 'docid', v: file.docid ?? '' },
          { k: 'ref', v: file.ref ?? '' },
          { k: 'hash', v: file.hash ?? '' },
          { k: 'content-type', v: file.contentType ?? '' },
        ]}
      />
      <ObjectView
        theme={args.theme}
        name={'frontmatter'}
        data={Obj.truncateStrings(frontmatter, 40)}
        expand={0}
      />
      {args.loading ? <div>{'Loading content'}</div> : undefined}
    </div>
  );
}

export function renderFileLeaf(args: Args) {
  const file = args.file;
  if (!file) return undefined;
  return (
    <KeyValue.UI
      theme={args.theme}
      items={[
        { kind: 'title', v: 'Leaf Content' },
        { k: 'ref', v: file.ref ?? '' },
        { k: 'content-type', v: file.contentType ?? '' },
        ...(args.loading ? [{ k: 'status', v: 'loading' }] : []),
      ]}
    />
  );
}
