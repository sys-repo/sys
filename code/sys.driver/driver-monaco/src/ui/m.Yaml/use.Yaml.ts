import React from 'react';
import {
  type t,
  Bus,
  Delete,
  Immutable,
  Lease,
  Obj,
  Rx,
  Yaml,
  singleton,
  slug,
  useBus,
} from './common.ts';
import { Path } from './m.Path.ts';

import { useErrorMarkers } from './use.ErrorMarkers.ts';

/** Singleton registry for editor cursor observers (per editorId). */
type Registry = { refCount: number; producer: t.EditorYamlCursorPathObserver };
const registry = new Map<string, Registry>();

/** Module-level lease for editor instances (latest-wins per editorId). */
const editorLease = Lease.make<t.StringId>();
const useEditorLease = Lease.makeUseLease(editorLease);

/**
 * Yaml sync/parsing hook.
 */
export const useYaml: t.UseEditorYaml = (args) => {
  const { monaco, editor, doc, path, debounce } = args;
  const editorId = editor?.getId() ?? '';

  /**
   * Refs:
   */
  const bus$ = useBus(args.bus$);
  const instanceRef = React.useRef(slug());
  const token = instanceRef.current;

  /**
   * Hooks:
   */
  const [rev, setRev] = React.useState(0);
  const [parser, setParser] = React.useState<t.YamlSyncParser>();
  const [cursor, setCursor] = React.useState<t.EditorCursor>();

  /** YAML parsing diagnostics: */
  useErrorMarkers({
    enabled: args.errorMarkers ?? false, // NB: opt-in.
    errors: parser?.errors,
    monaco,
    editor,
  });

  /**
   * Lease: claim on mount, release on unmount (per editor).
   */
  useEditorLease(editorId, token);

  /**
   * Effect: YAML parsing.
   * - Emits an initial snapshot immediately.
   * - Emits on subsequent parser events.
   * - Implements ping/pong listener for ["yaml"]
   */
  React.useEffect(() => {
    if (!doc || !path) return void setParser(undefined);

    const parser = Yaml.syncer({ doc, path, debounce });
    setParser(parser);

    const emit = () => {
      if (editorId === '') return;
      const e = { kind: 'editor:yaml', ...parser.current, editorId } satisfies t.EventYaml;
      Bus.emit(bus$, 'micro', e);
    };

    if (parser.current) emit(); // initial snapshot
    parser.$.subscribe(emit);

    // Listen and repond to `ping` requests:
    bus$
      .pipe(
        Rx.takeUntil(parser.dispose$),
        Bus.Filter.ofKind('editor:ping'),
        Rx.filter((e) => e.request.includes('yaml')),
      )
      .subscribe((e) => {
        emit();
        Bus.pong(bus$, e.nonce, ['yaml']);
      });

    return parser.dispose;
  }, [editorId, Obj.hash([...wrangle.docDeps(doc), path, debounce])]);

  /**
   * Effect: Monitor cursor path (singleton per `editorId`).
   */
  React.useEffect(() => {
    if (!editor || !monaco || !editorId) return;

    const s = singleton(registry, editorId, () => Path.observe({ bus$, editor }));
    const sub = s.producer.$.pipe(
      Rx.map((e) => Delete.fields(e, 'kind')),
      Rx.filter((e) => e.path.length > 0 || !!e.position),
      Lease.guard(editorLease, editorId, token), // ← NB: only the current lease-holder may proceed.
    ).subscribe(setCursor);

    return () => {
      sub.unsubscribe();
      s.dispose(); // Release this consumer from the singleton registry.
    };
  }, [editor, monaco, bus$, editorId, token]);

  /**
   * Effect: revision counter (increments on yaml or cursor events).
   */
  React.useEffect(() => {
    const life = Rx.disposable();
    const $ = bus$.pipe(Rx.takeUntil(life.dispose$));

    const sub = $.pipe(
      Bus.Filter.ofKind('editor:yaml', 'editor:yaml:cursor'),
      Rx.filter((e) => e.editorId === editorId),
      Lease.guard(editorLease, editorId, token), // ← Only the current lease-holder may proceed.
      Rx.scan((n) => n + 1, 0),
      Rx.distinctUntilChanged(),
    ).subscribe(setRev);

    return () => {
      sub.unsubscribe();
      life.dispose();
    };
  }, [bus$, editorId, token]);

  /**
   * API:
   */
  const api: t.EditorYamlHook = {
    get ok() {
      return api.current?.data.ok ?? true;
    },
    get current() {
      if (!parser?.current || !cursor) return undefined;
      if ((cursor.path?.length ?? 0) === 0 && !cursor.position) return undefined;
      return {
        rev,
        cursor,
        data: parser.current,
      } satisfies t.EditorYamlHook['current'];
    },
  };

  return api;
};

/**
 * Helpers:
 */
const wrangle = {
  docDeps(input: t.UseEditorYamlArgs['doc']) {
    if (!input) return [];
    if (Immutable.Is.immutableRef(input)) return [input.instance];
    return [input.source?.instance, input.target?.instance];
  },
} as const;
