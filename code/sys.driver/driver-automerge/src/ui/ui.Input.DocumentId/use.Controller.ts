import React, { useRef } from 'react';

import { type t, CrdtIs, Is, Signal, slug } from './common.ts';
import { useLocalStorage } from './use.LocalStorage.ts';
import { useTransientMessage } from './use.TransientMessage.ts';

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
  const signalsRef = useRef<t.DocumentIdHookSignals>(wrangle.signals(args));

  /**
   * Hooks:
   */
  const [ready, setReady] = React.useState(false);
  const localstore = useLocalStorage(args.localstorageKey, signalsRef.current.id);
  const transient = useTransientMessage();

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
    const props = wrangle.props(p, repo);
    const enabled = props.is.enabled.action;

    if (action === 'Copy') {
      const id = p.id.value;
      if (id) {
        navigator.clipboard.writeText(id);
        transient.write('Copy', 'copied');
      }
      return;
    }

    if (action === 'Clear') {
      p.id.value = undefined;
      p.doc.value = undefined;
      p.spinning.value = false;
      return;
    }

    if (action === 'Create' && enabled) {
      const doc = repo.create(args.initial ?? {});
      p.doc.value = doc;
      p.id.value = doc.id;
      p.spinning.value = false;
      localstore.history.push(doc.id);
      return;
    }

    if (action === 'Load' && props.id && enabled) {
      const id = props.id;

      p.spinning.value = true;
      const res = await repo.get(id);
      p.spinning.value = false;

      p.doc.value = res.doc;
      if (res.doc) localstore.history.push(id);
      if (res.error?.kind === 'Timeout') transient.write('Error', 'timed out');
      if (res.error?.kind === 'NotFound') {
        transient.write('Error', 'document not found');
        localstore.history.remove(id);
      }
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
    if (e.key === 'Enter') {
      const props = wrangle.props(signalsRef.current, repo);
      run(props.action);
    }

    // Up/Down History:
    if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
      localstore.handlers.onArrowKey(e);
    }

    // Copy (Clipboard):
    if (e.modifiers.meta && e.key === 'c') {
      run('Copy');
    }

    // Escape (reset to current document-id):
    if (e.key === 'Escape') {
      const p = signalsRef.current;
      const doc = p.doc.value;
      if (doc && doc.id !== p.id.value) p.id.value = doc.id;
      localstore.history.reset();
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
    get transient() {
      return transient.toObject();
    },
    get props() {
      return wrangle.props(signals, repo);
    },
    get history() {
      return localstore.history?.items ?? [];
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

  id(p: P) {
    return (p.id.value ?? '').trim();
  },

  action(p: P): t.DocumentIdInputAction {
    const id = wrangle.id(p);
    if (!id) return 'Create';
    return 'Load';
  },

  signals(args: Args) {
    const api: t.DocumentIdHookSignals = {
      id: args.signals?.id ?? Signal.create<string>(),
      doc: args.signals?.doc ?? Signal.create<t.CrdtRef>(),
      spinning: args.signals?.spinning ?? Signal.create(false),
      toValues() {
        const spinning = api.spinning.value;
        const doc = api.doc.value;
        const id = api.id.value;
        return { id, doc, spinning };
      },
    };
    return api;
  },
} as const;
