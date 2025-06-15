import React, { useRef } from 'react';

import { type t, CrdtIs, Is, Signal, slug } from './common.ts';
import { useLocalStorage } from './use.LocalStorage.ts';

type Args = t.UseDocumentIdHookArgs;
type Hook = t.DocumentIdHook;
type P = t.DocumentIdHookSignals;

/**
 * Hook: controller (or passthough).
 */
export const useController: t.UseDocumentIdHook = (input: Hook | Args = {}) => {
  return isHook(input)
    ? input //                ← Controlled   (passed in hook)
    : useInternal(input); //  ← Uncontrolled (manage hook locally)
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
  const localstore = useLocalStorage(args.localstorageKey, signalsRef.current.id);

  /**
   * Effect: (repo changed → reset).
   */
  React.useEffect(() => {
    setReady(false);
    signalsRef.current.doc.value = undefined;
  }, [repoId]);

  /**
   * Effect: (init on mount or reset).
   */
  React.useEffect(() => {
    if (ready) return;
    const props = api.props;
    if (props.id && !props.doc) run('Load').then(() => setReady(true));
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
   * Handlers:
   */
  const run = async (action: t.DocumentIdInputAction) => {
    if (!repo) return;
    const p = signalsRef.current;
    const props = wrangle.props(p, ready, repo);
    const enabled = props.is.enabled.action;

    if (action === 'Clear') {
      p.id.value = undefined;
      p.doc.value = undefined;
      return;
    }

    if (action === 'Create' && enabled) {
      const doc = repo.create(args.initial ?? {});
      p.doc.value = doc;
      p.id.value = doc.id;
      localstore.history.push(doc.id);
      return;
    }

    if (action === 'Load' && props.id && enabled) {
      p.spinning.value = true;
      p.doc.value = await repo.get(props.id);
      p.spinning.value = false;
      localstore.history.push(props.id);
      return;
    }
  };

  const onTextChange: t.TextInputChangeHandler = (e) => {
    const p = signalsRef.current;
    const doc = p.doc.value;
    if (doc && doc.id !== e.value) p.doc.value = undefined;
    p.id.value = e.value;
  };

  const onKeyDown: t.TextInputKeyHandler = (e) => {
    const p = signalsRef.current;

    if (e.key === 'Enter') {
      const props = wrangle.props(signalsRef.current, ready, repo);
      run(props.action);
    }

    if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
      localstore.handlers.onArrowKey(e);
    }
  };

  const onAction: t.DocumentIdInputActionHandler = (e) => run(e.action);

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
