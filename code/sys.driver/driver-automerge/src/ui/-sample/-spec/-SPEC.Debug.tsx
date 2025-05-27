import React from 'react';
import {
  type t,
  Button,
  css,
  D,
  IndexedDBStorageAdapter,
  LocalStorage,
  ObjectView,
  Repo,
  Signal,
} from '../common.ts';

type P = t.SampleProps;
type LocalStore = { docUri?: t.AutomergeUrl };

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;
  const localstore = LocalStorage.immutable<LocalStore>(`${D.name}`, {});
  const repo = new Repo({ storage: new IndexedDBStorageAdapter() });

  const props = {
    debug: s(false),
    theme: s<t.CommonTheme>('Dark'),
    doc: s<P['doc']>(),
  };
  const p = props;
  const api = {
    props,
    repo,
    localstore,
    listen() {
      p.debug.value;
      p.theme.value;
      p.doc.value;
    },
  };
  return api;
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
};

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const repo = debug.repo;
  const p = debug.props;
  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Setup sample document.
   */
  React.useEffect(() => void initDoc(debug), []);

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>
        <div>{`${D.name}: CRDT`}</div>
        <div>{'IndexedDB'}</div>
      </div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      {sampleDocButtons(debug)}

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={[]} style={{ marginTop: 10 }} />
    </div>
  );
};

/**
 * Dev Helpers:
 */
export async function initDoc(debug: DebugSignals) {
  const { repo, localstore } = debug;
  const p = debug.props;

  const listen = (doc: t.DocHandle<t.SampleDoc>) => {
    doc.addListener('change', (e) => {
      p.doc.value = e.doc;
    });
  };

  const uri = localstore.current.docUri;
  if (!uri) {
    // Create:
    const doc = repo.create<t.SampleDoc>({ cards: [], count: 0 });
    await doc.whenReady();
    listen(doc);
    localstore.change((d) => (d.docUri = doc.url));
    p.doc.value = doc.doc();
  } else {
    // Retrieve:
    const doc = await repo.find<t.SampleDoc>(uri);
    listen(doc);
    p.doc.value = doc.doc();
  }
}

export function sampleDocButtons(debug: DebugSignals) {
  const { repo, localstore } = debug;

  const increment = async (by: number) => {
    const uri = localstore.current.docUri;
    if (!uri) return;
    const doc = await repo.find<t.SampleDoc>(uri);
    doc.change((d) => (d.count += by));
  };

  return (
    <React.Fragment>
      <Button block label={() => `increment`} onClick={() => increment(1)} />
      <Button block label={() => `decrement`} onClick={() => increment(-1)} />
    </React.Fragment>
  );
}
