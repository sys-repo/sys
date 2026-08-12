import React from 'react';
import { Monaco } from '../mod.ts';

globalThis.performance.clearResourceTimings();
globalThis.performance.setResourceTimingBufferSize(512);

type EditorReady = {
  readonly monaco: Parameters<
    NonNullable<React.ComponentProps<typeof Monaco.Editor>['onMounted']>
  >[0]['monaco'];
  readonly editor: Parameters<
    NonNullable<React.ComponentProps<typeof Monaco.Editor>['onMounted']>
  >[0]['editor'];
};

/** Browser-only runtime proof for local Monaco assets and language workers. */
export const MonacoSmoke: React.FC = () => {
  const editors = React.useRef<Partial<Record<'typescript' | 'json', EditorReady>>>({});
  const started = React.useRef(false);
  const finished = React.useRef(false);
  const [status, setStatus] = React.useState('pending');

  const report = React.useCallback((next: string) => {
    globalThis.document.body.dataset.monacoSmoke = next;
    setStatus(next);
  }, []);

  const finish = React.useCallback((next: 'failed' | 'passed', error?: unknown) => {
    if (finished.current) return;
    finished.current = true;
    if (error !== undefined) {
      const message = error instanceof Error ? error.message : String(error);
      globalThis.document.body.dataset.monacoSmokeError = message;
      console.error(`Monaco browser smoke failed: ${message}`);
    }
    report(next);
  }, [report]);

  React.useEffect(() => {
    const timeout = globalThis.setTimeout(() => {
      finish('failed', new Error('Editors did not complete browser smoke within 6 seconds.'));
    }, 6_000);
    return () => globalThis.clearTimeout(timeout);
  }, [finish]);

  const run = async () => {
    const typescript = editors.current.typescript;
    const json = editors.current.json;
    if (started.current || !typescript || !json) return;
    started.current = true;
    report('running');

    try {
      await waitForMarker(typescript, 'typescript');
      await waitForMarker(json, 'json');
      assertRuntimeResources();
      finish('passed');
    } catch (error) {
      finish('failed', error);
    }
  };

  const onMounted = (language: 'typescript' | 'json') => (e: EditorReady) => {
    editors.current[language] = e;
    void run();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100vh' }}>
      <Monaco.Editor
        language={'typescript'}
        defaultValue={'const value: string = 42;'}
        onMounted={onMounted('typescript')}
      />
      <Monaco.Editor
        language={'json'}
        defaultValue={'{ "value": }'}
        onMounted={onMounted('json')}
      />
      <output data-testid={'monaco-smoke'}>{status}</output>
    </div>
  );
};

function assertRuntimeResources() {
  const resources = performance.getEntriesByType('resource').map((entry) => entry.name);
  const vs = new URL('./vs/', globalThis.document.baseURI);
  const local = resources
    .map((resource) => new URL(resource, location.href))
    .filter((resource) =>
      resource.origin === vs.origin && resource.pathname.startsWith(vs.pathname)
    );
  const required = ['/loader.js', '/editor/editor.main.js', '/editor/editor.main.css'];
  for (const suffix of required) {
    if (!local.some((resource) => resource.pathname.endsWith(suffix))) {
      const observed = resources
        .filter((resource) => resource.includes('/vs/'))
        .join(', ') || 'none';
      throw new Error(
        `Missing Monaco runtime resource: ${suffix}. Expected root: ${vs.href}. ` +
          `Document: ${location.href}. Observed Monaco resources: ${observed}.`,
      );
    }
  }

  const external = resources
    .map((resource) => new URL(resource, location.href))
    .filter((resource) => {
      return (resource.protocol === 'http:' || resource.protocol === 'https:') &&
        resource.origin !== location.origin;
    });
  if (external.length > 0) {
    throw new Error(
      `Third-party browser resources: ${external.map((url) => url.href).join(', ')}.`,
    );
  }

  globalThis.document.body.dataset.monacoSmokeResources = String(local.length);
}

async function waitForMarker(editor: EditorReady, owner: 'json' | 'typescript') {
  const model = editor.editor.getModel();
  if (!model) throw new Error(`${owner} editor has no model.`);

  for (let index = 0; index < 50; index++) {
    const markers = editor.monaco.editor.getModelMarkers({ owner, resource: model.uri });
    if (markers.length > 0) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`${owner} worker did not produce a diagnostic marker.`);
}
