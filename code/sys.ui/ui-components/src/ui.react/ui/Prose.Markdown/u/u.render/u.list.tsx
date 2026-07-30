import { css, Markdown, Num, type t } from '../../common.ts';
import type { MarkdownNodeRecord } from '../u.node.ts';

type ListRenderArgs = {
  node: MarkdownNodeRecord;
  children: t.ReactNode;
  style: t.Style.Transform.Result;
};

type ListItemStyles = Pick<
  t.ProseMarkdown.Styles,
  | 'listItem'
  | 'taskListItem'
  | 'taskRow'
  | 'taskState'
  | 'taskCheckbox'
  | 'taskBody'
>;

type ListItemRenderArgs = {
  node: MarkdownNodeRecord;
  children: t.ReactNode;
  renderer?: t.ProseMarkdown.Block.TaskState.Renderer;
  styles: ListItemStyles;
};

type TaskStateRenderArgs = {
  node: t.ProseMarkdown.Block.TaskState.Node;
  renderer?: t.ProseMarkdown.Block.TaskState.Renderer;
  style: t.Style.Transform.Result;
};

export function renderList(args: ListRenderArgs): t.ReactNode {
  const { node, children, style } = args;
  const start = Num.Is.safeInt(node.start) ? node.start : undefined;

  return node.ordered === true
    ? <ol className={style.class} start={start}>{children}</ol>
    : <ul className={style.class}>{children}</ul>;
}

export function renderListItem(args: ListItemRenderArgs): t.ReactNode {
  const { node, children, renderer, styles } = args;
  if (!Markdown.Is.taskListItem(node)) {
    return <li className={styles.listItem.class}>{children}</li>;
  }

  return (
    <li className={css(styles.listItem, styles.taskListItem).class}>
      <div className={styles.taskRow.class}>
        <div className={styles.taskState.class}>
          {renderTaskState({ node, renderer, style: styles.taskCheckbox })}
        </div>
        <div className={styles.taskBody.class}>{children}</div>
      </div>
    </li>
  );
}

function renderTaskState(args: TaskStateRenderArgs): t.ReactNode {
  const { node, renderer, style } = args;
  const checked = node.checked;
  const ariaLabel = checked ? 'Completed task' : 'Incomplete task';

  return renderer?.({ node, checked, ariaLabel }) ?? (
    <input
      aria-label={ariaLabel}
      aria-readonly
      checked={checked}
      className={style.class}
      onClick={(e) => e.preventDefault()}
      readOnly
      tabIndex={-1}
      type='checkbox'
    />
  );
}
