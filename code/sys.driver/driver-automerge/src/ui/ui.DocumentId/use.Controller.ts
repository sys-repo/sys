import React, { useRef } from 'react';

import { type t, D, Is, Kbd, Signal, slug } from './common.ts';
import { DocUrl, Parse } from './u.ts';
import { useLocalStorage } from './use.LocalStorage.ts';
import { useTransientMessage } from './use.TransientMessage.ts';

type Args = t.UseDocumentIdHookArgs;
type Hook = t.DocumentIdHook;
type P = t.DocumentIdHookSignals;

/**
 * Hook (or passthough):
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
  const url = args.url ?? D.url;
  const urlKey = args.urlKey ?? D.urlKey;
  const readOnly = args.readOnly ?? D.readOnly;

  /**
   * Refs:
   */
  const signalsRef = useRef<t.DocumentIdHookSignals>(wrangle.signals(args));
  const signals = signalsRef.current;

  if (url) {
    const { docId } = DocUrl.read(location.href, urlKey);
    if (docId && !signals.textbox.value) signals.textbox.value = docId.trim();
  }

  /**
   * Hooks:
   */
  const [ready, setReady] = React.useState(false);
  const localstore = useLocalStorage({
    key: args.localstorage,
    signal: signalsRef.current.textbox,
    readOnly,
  });
  const transient = useTransientMessage();

  /**
   * Effect: (init on mount or reset).
   */
  React.useEffect(() => {
    if (ready) return;
    const props = api.props;
    if (props.textbox && !props.doc) run({ action: 'Load' }).then(() => setReady(true));
    else setReady(true);
  }, [repoId, ready]);

  /**
   * Effect: (repo changed → reset).
   */
  React.useEffect(() => {
    setReady(false);
    signalsRef.current.doc.value = undefined;
  }, [repoId]);

  /**
   * Effect: (hook into redraw listeners).
   */
  Signal.useRedrawEffect(() => {
    const p = signalsRef.current;
    p.textbox.value;
    p.doc.value;
    p.spinning.value;
  });

  /**
   * Handlers:
   */
  const run = async (e: t.DocumentIdActionArgs) => {
    if (!repo) return;
    const p = signalsRef.current;
    const props = wrangle.props(args, p, repo);
    const enabled = props.is.enabled.action;

    if (e.action === 'Copy') {
      const docId = p.textbox.value;
      if (docId) {
        navigator.clipboard.writeText(docId);
        transient.write('Copy', 'document-id copied');
      }
    }

    if (e.action === 'Copy:Url') {
      const href = e.href;
      if (href) {
        navigator.clipboard.writeText(href);
        transient.write('Copy', 'url copied');
        if (e.addressbarAction === 'add') DocUrl.Mutate.replace(href);
        if (e.addressbarAction === 'remove') DocUrl.Mutate.strip(href, urlKey);
      }
      return;
    }

    if (e.action === 'Clear') {
      p.textbox.value = undefined;
      p.doc.value = undefined;
      p.path.value = undefined;
      p.spinning.value = false;
      return;
    }

    if (e.action === 'Create' && enabled) {
      const doc = repo.create(args.initial ?? {});
      p.doc.value = doc;
      p.textbox.value = doc.id;
      p.spinning.value = false;
      localstore.history.push(doc.id);
      return;
    }

    if (e.action === 'Load' && props.docId && enabled) {
      const id = props.docId;

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

      if (ready) {
        const { exists } = DocUrl.read(location.href, urlKey);
        if (exists) {
          // The doc-id is represented in the URL query-string update it now.
          const href = DocUrl.resolve(args.url, id, urlKey);
          if (href) DocUrl.Mutate.replace(href);
        }
      }

      return;
    }
  };

  const onTextChange: t.TextInputChangeHandler = (e) => {
    const p = signalsRef.current;
    const doc = p.doc.value;
    const parsed = Parse.textbox(e.value);
    if (doc && doc.id !== parsed.id) p.doc.value = undefined;
    p.textbox.value = e.value;
    p.path.value = parsed.path;
  };

  const onKeyDown: t.TextInputKeyHandler = (e) => {
    if (e.key === 'Enter') {
      const props = wrangle.props(args, signalsRef.current, repo);
      run(props.action);
    }

    // Up/Down History:
    if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
      localstore.handlers.onArrowKey(e);
    }

    // Escape (reset to current document-id):
    if (e.key === 'Escape') {
      const p = signalsRef.current;
      const doc = p.doc.value;
      if (doc && doc.id !== p.textbox.value) p.textbox.value = doc.id;
      localstore.history.reset();
    }

    // Clipboard:
    if (Kbd.Is.copy(e)) {
      const p = signalsRef.current;
      const docId = p.textbox.value;
      if (docId) {
        if (e.modifiers.shift) {
          const href = DocUrl.resolve(url, docId, urlKey);
          if (href) run({ action: 'Copy:Url', href, addressbarAction: 'add' });
        } else {
          run({ action: 'Copy' });
        }
        e.cancel(); // Handled.
      }
    }
  };

  const onAction: t.DocumentIdActionHandler = (e) => run(e);

  /**
   * API:
   */
  const api: t.DocumentIdHook = {
    ready,
    instance,
    signals,
    handlers: { onAction, onTextChange, onKeyDown },
    get transient() {
      return transient.toObject();
    },
    get props() {
      return wrangle.props(args, signals, repo);
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
  props(args: Args, p: P, repo: t.CrdtRepo | undefined): t.DocumentIdHookProps {
    const { urlKey = D.urlKey, url = D.url, readOnly = D.readOnly } = args;
    const is = wrangle.is(p, repo);
    const parsed = wrangle.parsed(p);
    const textbox = parsed.text;
    const docId = parsed.id || undefined;
    const doc = p.doc.value;
    const action = wrangle.action(p);
    return { textbox, docId, repo, doc, is, action, url, urlKey, readOnly };
  },

  is(p: P, repo?: t.CrdtRepo): t.DocumentIdHookProps['is'] {
    const parsed = wrangle.parsed(p);
    const id = parsed.id;
    const doc = p.doc.value;
    const valid = !!id;

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

  parsed(p: P) {
    const text = (p.textbox.value ?? '').trim();
    return Parse.textbox(text);
  },

  action(p: P): t.DocumentIdActionArgs {
    const id = wrangle.parsed(p).id;
    if (!id) return { action: 'Create' };
    return { action: 'Load' };
  },

  signals(args: Args) {
    const api: t.DocumentIdHookSignals = {
      textbox: args.signals?.textbox ?? Signal.create<string>(),
      doc: args.signals?.doc ?? Signal.create<t.CrdtRef>(),
      path: args.signals?.path ?? Signal.create<t.ObjectPath>(),
      spinning: args.signals?.spinning ?? Signal.create(false),
      toValues() {
        const textbox = api.textbox.value;
        const doc = api.doc.value;
        const spinning = api.spinning.value;
        return { textbox, doc, spinning };
      },
    };
    return api;
  },
} as const;
