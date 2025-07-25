import { useEffect } from 'react';
import { type t, Yaml } from './common.ts';

export function useYamlParser(signals: t.SampleSignals) {
  const doc = signals.doc.value;
  const editorPath = signals['yaml.path'].value;

  /**
   * Effect: Yaml Parser
   */
  useEffect(() => {
    if (!doc || !editorPath) return;

    const debounce = 300;
    const syncer = Yaml.syncer(doc, editorPath, { debounce });

    const update = (parsed: any, error?: t.StdError) => {
      signals['yaml.parsed'].value = parsed;
      signals['yaml.error'].value = error;
    };

    update(syncer.current.parsed(), syncer.errors[0]);
    syncer.$.subscribe((e) => update(e.parsed, e.error));

    return syncer.dispose;
  }, [doc?.instance, (editorPath ?? []).join()]);
}
