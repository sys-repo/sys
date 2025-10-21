import { type t, Color, D } from './common.ts';

/**
 * Returns a themed 1px solid border string with the given opacity.
 */
export function edgeBorder(theme: t.ColorTheme, opacity = D.edgeBorderOpacity) {
  return `solid 1px ${Color.alpha(theme.fg, opacity)}`;
}

/**
 * Normalizes header configuration with defaults for visibility and read-only state.
 */
export function headerConfig(props?: t.CrdtLayoutHeaderConfig): t.CrdtLayoutHeaderConfig {
  return {
    visible: props?.visible ?? D.header.visible,
    readOnly: props?.readOnly ?? D.header.readOnly,
  };
}

/**
 * Normalizes sidebar configuration with defaults for visibility, position, and width.
 */
export function sidebarConfig(props?: t.CrdtLayoutSidebarConfig): t.CrdtLayoutSidebarConfig {
  return {
    visible: props?.visible ?? D.sidebar.visible,
    position: props?.position ?? D.sidebar.position,
    width: props?.width ?? D.sidebar.width,
  };
}

/**
 * Discriminated union for render-time readiness.
 */
type RenderCtx =
  | { readonly ready: false }
  | { readonly ready: true; readonly ctx: t.CrdtLayoutCtx };
/**
 * Build slot context if the CRDT layout is ready.
 */
export function renderCtx(props: t.CrdtLayoutProps): RenderCtx {
  const { crdt, theme = D.theme, debug = false } = props;
  const doc = crdt?.signals?.doc.value;
  const repo = crdt?.repo;

  if (repo && doc) {
    const ctx = { repo, doc, theme, debug } satisfies t.CrdtLayoutCtx;
    return { ready: true, ctx };
  }

  return { ready: false };
}
