import React from 'react';
import { type t, BulletList, Str } from './common.ts';

type Props = {
  selected?: string;
  refs?: string[];
  onSelect?: (next: string) => void;
};

export function renderTreeContentCard(
  e: t.ActionProbe.ProbeRenderArgs<t.TEnv, t.TreeContentParams>,
  props: Props,
) {
  const refs = props.refs ?? [];

  e.element(
    <div>
      Loads tree, resolves one <code>ref</code>, then loads indexed file-content by hash.
    </div>,
  );

  e.element(
    <BulletList.UI
      selected={props.selected}
      items={toBulletItems(refs)}
      onSelect={(ev) => props.onSelect?.(ev.id)}
    />,
  );
}

function toBulletItems(refs: string[]): t.BulletList.Item[] {
  return refs.map((id, index) => {
    const label = <span>{`${index + 1}. ${Str.ellipsize(id, [22, 8], '..')}`}</span>;
    return { id, label };
  });
}
