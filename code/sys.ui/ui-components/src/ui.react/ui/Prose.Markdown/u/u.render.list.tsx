import { css, Markdown, Num, type t } from '../common.ts';
import type { MarkdownNodeRecord } from './u.node.ts';
import type { MarkdownStyles } from './u.styles.ts';

type ListRenderArgs = {
  readonly node: MarkdownNodeRecord;
  readonly children: t.ReactNode;
  readonly styles: MarkdownStyles;
};

type ListItemRenderArgs = ListRenderArgs & {
  readonly renderers?: t.ProseMarkdown.Renderers;
};

export function renderList(args: ListRenderArgs) {
  const { node, children, styles } = args;
  const start = Num.Is.safeInt(node.start) ? node.start : undefined;

  return node.ordered === true
    ? <ol className={styles.list.class} start={start}>{children}</ol>
    : <ul className={styles.list.class}>{children}</ul>;
}

export function renderListItem(args: ListItemRenderArgs) {
  const { node, children, styles } = args;
  if (!Markdown.Is.taskListItem(node)) {
    return <li className={styles.listItem.class}>{children}</li>;
  }

  return (
    <li className={css(styles.listItem, styles.taskListItem).class}>
      <div className={styles.taskRow.class}>
        <div className={styles.taskState.class}>{renderTaskState(node, args)}</div>
        <div className={styles.taskBody.class}>{children}</div>
      </div>
    </li>
  );
}

function renderTaskState(
  node: t.ProseMarkdown.Block.TaskState.Node,
  ctx: Pick<ListItemRenderArgs, 'renderers' | 'styles'>,
) {
  const { renderers, styles } = ctx;
  const checked = node.checked;
  const ariaLabel = checked ? 'Completed task' : 'Incomplete task';

  return renderers?.taskState?.({ node, checked, ariaLabel }) ?? (
    <input
      aria-label={ariaLabel}
      aria-readonly
      checked={checked}
      className={styles.taskCheckbox.class}
      onClick={(e) => e.preventDefault()}
      readOnly
      tabIndex={-1}
      type='checkbox'
    />
  );
}
