import { type t, Color, D } from './common.ts';

/**
 * Returns a themed 1px solid border string with the given opacity.
 */
export function edgeBorder(theme: t.ColorTheme, opacity = D.edgeBorderOpacity) {
  return `solid 1px ${Color.alpha(theme.fg, opacity)}`;
}

/**
 * Normalizes `header` configuration with defaults.
 */
export function toHeaderConfig(input?: t.LayoutHeader): t.LayoutHeader {
  const d = D.header;
  return {
    visible: input?.visible ?? d.visible,
    readOnly: input?.readOnly ?? d.readOnly,
  };
}

/**
 * Normalizes `sidebar` configuration with defaults.
 */
export function toSidebarConfig(input?: t.LayoutSidebar): t.LayoutSidebar {
  const d = D.sidebar;
  return {
    visible: input?.visible ?? d.visible,
    position: input?.position ?? d.position,
    width: input?.width ?? d.width,
  };
}

/**
 * Normalizes `sidebar` configuration with defaults.
 */
export function toCropmarksConfig(input?: t.LayoutCropmarks): t.LayoutCropmarks {
  const d = D.cropmarks;
  return {
    size: input?.size ?? d.size,
    borderWidth: input?.borderWidth ?? d.borderWidth,
    borderColor: input?.borderColor ?? d.borderColor,
    borderOpacity: input?.borderOpacity ?? d.borderOpacity,
    subjectOnly: input?.subjectOnly ?? d.subjectOnly,
  };
}

/**
 * Discriminated union for render-time readiness.
 */
type RenderCtx = { readonly ready: false } | { readonly ready: true; readonly ctx: t.LayoutCtx };
/**
 * Build slot context if the CRDT layout is ready.
 */
export function renderCtx(props: t.LayoutProps): RenderCtx {
  const { crdt, signals, theme = D.theme, debug = false } = props;
  const doc = signals?.doc.value;
  const repo = crdt?.repo;

  if (repo) {
    const ctx = { repo, doc, theme, debug } satisfies t.LayoutCtx;
    return { ready: true, ctx };
  }

  return { ready: false };
}
