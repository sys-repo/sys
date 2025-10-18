import { type t, Color, D } from './common.ts';

export function edgeBorder(theme: t.ColorTheme, opacity = D.edgeBorderOpacity) {
  return `solid 1px ${Color.alpha(theme.fg, opacity)}`;
}

export function headerConfig(props?: t.CrdtLayoutHeaderConfig): t.CrdtLayoutHeaderConfig {
  return {
    visible: props?.visible ?? D.header.visible,
    readOnly: props?.readOnly ?? D.header.readOnly,
    localstorage: props?.localstorage,
    urlKey: props?.urlKey,
  };
}

export function sidebarConfig(props?: t.CrdtLayoutSidebarConfig): t.CrdtLayoutSidebarConfig {
  return {
    visible: props?.visible ?? D.sidebar.visible,
    position: props?.position ?? D.sidebar.position,
    width: props?.width ?? D.sidebar.width,
  };
}

export function slotCtx(props: t.CrdtLayoutProps): t.CrdtLayoutCtx {
  const { repo, signals, theme = D.theme, debug = false } = props;
  const doc = signals?.doc.value;
  return { repo, doc, theme, debug };
}
