import React, { useCallback, useRef } from 'react';
import { type t, CrdtIs, Is, Signal, slug } from './common.ts';

type Args = t.UseDocumentIdHookArgs;
type Hook = t.DocumentIdHook;
type P = t.DocumentIdHookSignals;

/**
 * Hook: controller (or passthough).
 */
export const useController: t.UseDocumentIdHook = (input: Hook | Args = {}) => {
  return isHook(input)
    ? input //                ← Controlled.
    : useInternal(input); //  ← Uncontrolled.
};

/**
 * Internal (always runs full hook list):
 */
function useInternal(args: Args = {}): Hook {
  const instance = useRef(slug()).current;
  const repo = args.repo;
  const repoId = repo?.id.instance;

  /**
   * Refs:
   */
  const signalsRef = useRef<t.DocumentIdHookSignals>({
    id: args.signals?.id ?? Signal.create<string>(),
    doc: args.signals?.doc ?? Signal.create<t.CrdtRef>(),
    spinning: args.signals?.spinning ?? Signal.create(false),
  });

  /**
   * Effect: (hook into redraw listeners).
   */
  Signal.useRedrawEffect(() => {
    const p = signalsRef.current;
    p.id.value;
    p.doc.value;
    p.spinning.value;
  });

  /**
   * Effect: mount.
   */
  React.useEffect(() => {
    const props = api.props;
    if (props.id && !props.doc) run('Load');
  }, [repoId]);

  /**
   * Handlers:
   */
  const run = useCallback(
    async (action: t.DocumentIdInputAction) => {
      if (!repo) return;
      const p = signalsRef.current;
      const props = wrangle.props(p, repo);
      if (!props.is.enabled.action) return;

      if (action === 'Load' && props.id) {
        p.spinning.value = true;
        p.doc.value = await repo.get(props.id);
        p.spinning.value = false;
      }

      if (action === 'Create') {
        const doc = repo.create(args.initial ?? {});
        p.id.value = doc.id;
        p.doc.value = doc;
      }
    },
    [repoId],
  );

  const onTextChange = useCallback<t.TextInputChangeHandler>(
    (e) => {
      const p = signalsRef.current;
      const doc = p.doc.value;
      if (doc && doc.id !== e.value) p.doc.value = undefined;
      p.id.value = e.value;
    },
    [repoId],
  );

  const onKeyDown = useCallback<t.TextInputKeyHandler>(
    (e) => {
      if (e.key === 'Enter') {
        const props = wrangle.props(signalsRef.current, repo);
        run(props.action);
      }
    },
    [repoId],
  );

  const onActionClick = useCallback<t.DocumentIdInputActionHandler>((e) => run(e.action), [repoId]);

  /**
   * API:
   */
  let _props: t.DocumentIdHookProps | undefined; // NB: lazy-load.
  const signals = signalsRef.current;
  const api: t.DocumentIdHook = {
    instance,
    signals,
    handlers: { onActionClick, onTextChange, onKeyDown },
    get props() {
      return _props || (_props = wrangle.props(signals, repo));
    },
  };

  return api;
}

/**
 * Helpers:
 */
function isHook(input: unknown): input is Hook {
  return !!input && Is.string((input as any).instance);
}

const wrangle = {
  props(p: P, repo: t.CrdtRepo | undefined): t.DocumentIdHookProps {
    const id = wrangle.id(p);
    const is = wrangle.is(p, repo);
    const doc = p.doc.value;
    return { id, repo, doc, is, action: wrangle.action(p) };
  },

  id(p: P) {
    return (p.id.value ?? '').trim();
  },

  is(p: P, repo?: t.CrdtRepo): t.DocumentIdHookProps['is'] {
    const id = wrangle.id(p);
    const doc = p.doc.value;
    const valid = CrdtIs.id(id);

    let action = true;
    if (!repo) action = false;
    if (id && !valid) action = false;
    if (id && doc?.id === id) action = false;

    let input = true;
    if (!repo) input = false;

    return {
      valid,
      enabled: { action, input },
      spinning: p.spinning.value,
    };
  },

  action(p: P): t.DocumentIdInputAction {
    const id = wrangle.id(p);
    if (!id) return 'Create';
    return 'Load';
  },
} as const;
