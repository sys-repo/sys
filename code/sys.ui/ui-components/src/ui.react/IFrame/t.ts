import type { t } from './common.ts';
import type { HTMLAttributeReferrerPolicy } from 'react';

type HttpPermissionsPolicy = string; // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy
type Ref = React.RefObject<HTMLIFrameElement | null>;

/**
 * Component
 */
export type IFrameProps = {
  src?: t.StringUrl | IFrameSrc;
  width?: string | number;
  height?: string | number;
  title?: string;
  name?: string;
  sandbox?: boolean | t.IFrameSandbox[];
  allow?: HttpPermissionsPolicy;
  allowFullScreen?: boolean;
  referrerPolicy?: HTMLAttributeReferrerPolicy | undefined;
  loading?: t.IFrameLoading;
  //
  silent?: boolean;
  style?: t.CssInput;
  onReady?: IFrameReadyHandler;
  onLoad?: IFrameLoadedEventHandler;
};

/**
 * Applies extra restrictions to the content in the frame.
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox
 */
export type IFrameSandbox =
  | 'allow-downloads-without-user-activation'
  | 'allow-downloads'
  | 'allow-forms'
  | 'allow-modals'
  | 'allow-orientation-lock'
  | 'allow-pointer-lock'
  | 'allow-popups'
  | 'allow-popups-to-escape-sandbox'
  | 'allow-presentation'
  | 'allow-same-origin'
  | 'allow-scripts'
  | 'allow-storage-access-by-user-activation'
  | 'allow-top-navigation'
  | 'allow-top-navigation-by-user-activation';

/** Browser loading strategy hint for iframe content. */
export type IFrameLoading = 'eager' | 'lazy';
/** Source input for iframe content (raw HTML or URL). */
export type IFrameSrc = { html?: string; url?: t.StringUrl };

/**
 * Events
 */
export type IFrameReadyHandler = (e: IFrameReadyHandlerArgs) => void;
/** Payload provided when the iframe element is mounted and ready. */
export type IFrameReadyHandlerArgs = { ref: Ref };

/** Handler signature fired after iframe content has loaded. */
export type IFrameLoadedEventHandler = (e: IFrameLoadedEventHandlerArgs) => void;
/** Payload provided to iframe load handlers. */
export type IFrameLoadedEventHandlerArgs = { href: t.StringUrl; ref: Ref };
