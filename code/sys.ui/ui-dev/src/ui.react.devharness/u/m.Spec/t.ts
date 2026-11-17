import type { t } from '../common.ts';
import type { WrangleLib } from './u.Wrangle.ts';

type O = Record<string, unknown>;

/**
 * Root API to the UI Spec Runner system.
 */
export type SpecLib = {
  Wrangle: WrangleLib;
  describe: t.TestSuiteDescribe;
  /** Create an inert, factory-local owner for specimen attachments. */
  attachments(options?: SpecAttachmentsOptions): SpecAttachments;
  ctx(e: t.TestHandlerArgs | t.DevCtx): t.DevCtx;
  once(e: t.DevCtxInput, fn: (ctx: t.DevCtx) => any | Promise<any>): Promise<t.DevCtx>;
};

/** Policy supplied by one suite/debug factory; no acquisition occurs until attach. */
export type SpecAttachmentsOptions = {
  /** One effect from first live attachment to last detach; not a storage/durability protocol. */
  readonly shared?: t.SignalEffectFn;
};

/** Factory-local ownership; contexts and other factories remain independent. */
export type SpecAttachments = {
  /**
   * Replace this owner's attachment to ctx. Closed/missing admission returns a retired handle
   * without acquisition or replacement. Retirement observes reset and context disposal.
   * Synchronous same-owner reentry during shared acquisition throws before acquiring anything.
   * Initial setup failure retires the candidate and preserves its thrown value, not prior writes.
   * Running callbacks/async work are not cancelled; later reactive errors do not retire attachments.
   * Dependency release and failed effect-run lifetimes retain Signal's exception-safety limits.
   * External retirement follows normalized delivery, not upstream bridge teardown; no replay is added.
   */
  attach<T extends O = O>(ctx: t.DevCtx, args: SpecAttachmentArgs<T>): t.Lifecycle;
};

/** Subject configuration precedes ordered initial effect registration, not later reruns or paint. */
export type SpecAttachmentArgs<T extends O = O> = {
  readonly subject?: SpecAttachmentSubject<T>;
  /** Cleanup must be synchronous; the existing void-return type cannot enforce this. */
  readonly effects?: readonly t.SignalEffectFn[];
};

/**
 * Existing subject operations, with retirement checked between setters and no layout defaults.
 * Absent size performs no write; explicit undefined uses the existing size setter's clear.
 */
export type SpecAttachmentSubject<T extends O = O> =
  & {
    /** Register without invoking/awaiting the renderer. Undefined is not a renderer-clear operation. */
    readonly render: t.DevRenderer<T>;
    /** Absence leaves display unchanged; explicit undefined uses the existing setter's clear. */
    readonly display?: t.DevPropDisplay;
  }
  & (
    | { readonly size?: t.DevSubjectSize; readonly margin?: never }
    | { readonly size: t.DevFillMode; readonly margin?: t.CssMarginInput }
  );
