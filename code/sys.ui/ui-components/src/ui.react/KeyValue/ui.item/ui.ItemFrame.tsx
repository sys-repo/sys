import React from 'react';
import { type t } from '../common.ts';
import { ItemShell, ProjectionItemShell } from './ui.ItemShell.tsx';
import { type RenderContext } from './u.context.ts';
import { type CursorBoundary } from './u.cursor.ts';

type P = {
  readonly item: t.KeyValue.Item;
  readonly context: RenderContext;
  readonly cursor?: CursorBoundary;
  readonly depth: number;
  readonly children?: t.ReactNode;
};

export const ItemFrame: React.FC<P> = (props) => {
  const { item, context, cursor, depth, children } = props;
  const projection = depth === 0 ? context.projection : undefined;

  if (projection) {
    return (
      <ProjectionItemShell
        item={item}
        layout={context.layout}
        projection={projection}
        cursor={cursor}
        currentFill={context.cursorCurrentFill}
      >
        {children}
      </ProjectionItemShell>
    );
  }

  return (
    <ItemShell
      item={item}
      layout={context.layout}
      cursor={cursor}
      currentFill={context.cursorCurrentFill}
    >
      {children}
    </ItemShell>
  );
};
