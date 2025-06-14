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
   * Hooks:
   */
  const [ready, setReady] = React.useState(false);

  /**
   * Effect: repo changed.
   */
  React.useEffect(() => {
    setReady(false);
    signalsRef.current.doc.value = undefined;
  }, [repoId]);

  /**
   * Effect: mount.
   */
  React.useEffect(() => {
    if (ready) return;
    const { id, doc } = api.props;
    if (id && !doc) run('Load').then(() => setReady(true));
    else setReady(true);
  }, [repoId, ready]);

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
   * Effect: clear {doc} when doc-id is empty.
   */
  Signal.useEffect(() => {
    const p = signalsRef.current;
    p.doc.value;
    if (!p.id.value) p.doc.value = undefined;
  });

  /**
   * Handlers:
   */
  const run = useCallback(
    async (action: t.DocumentIdInputAction) => {
      if (!repo) return;
      const p = signalsRef.current;
      const props = wrangle.props(p, ready, repo);
      const enabled = props.is.enabled.action;

      if (action === 'Clear') {
        p.id.value = undefined;
        return;
      }

      if (action === 'Create' && enabled) {
        const doc = repo.create(args.initial ?? {});
        p.id.value = doc.id;
        p.doc.value = doc;
        return;
      }

      if (action === 'Load' && props.id && enabled) {
        p.spinning.value = true;
        p.doc.value = await repo.get(props.id);
        p.spinning.value = false;
        return;
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
        const props = wrangle.props(signalsRef.current, ready, repo);
        run(props.action);
      }
    },
    [repoId],
  );

  const onAction = useCallback<t.DocumentIdInputActionHandler>((e) => run(e.action), [repoId]);

  /**
   * API:
   */
  const signals = signalsRef.current;
  const api: t.DocumentIdHook = {
    ready,
    instance,
    signals,
    handlers: { onAction, onTextChange, onKeyDown },
    get props() {
      return wrangle.props(signals, ready, repo);
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
  props(p: P, ready: boolean, repo: t.CrdtRepo | undefined): t.DocumentIdHookProps {
    const id = wrangle.id(p);
    const is = wrangle.is(p, ready, repo);
    const doc = p.doc.value;
    return { id, repo, doc, is, action: wrangle.action(p) };
  },

  is(p: P, ready: boolean, repo?: t.CrdtRepo): t.DocumentIdHookProps['is'] {
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

  id(p: P) {
    return (p.id.value ?? '').trim();
  },

  action(p: P): t.DocumentIdInputAction {
    const id = wrangle.id(p);
    if (!id) return 'Create';
    return 'Load';
  },
} as const;
