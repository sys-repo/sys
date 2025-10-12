import { Button, Obj, Str, type t } from '../common.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';

export function yamlSamples(debug: DebugSignals) {
  const changeYaml = (fn: (args: { draft: any; path: t.ObjectPath }) => void) => {
    const doc = debug.signals.doc.value;
    const path = debug.props.path.value;
    if (doc && path) doc.change((draft) => fn({ draft, path }));
  };

  const samples: Array<{ label: string; yaml: string }> = [
    // ✅ WORKING (uses registered id: "video-player")
    {
      label: 'change: 🌳 { working slug }',
      yaml: `
        foo:
          id: example-slug
          traits:
            - as: player
              id: video-player
            - as: recorder
              id: video-recorder
          props:
            player:
              name: "Player A"
            recorder:
              name: "Recorder A"
      `,
    },

    // 💥 invalid YAML (syntax error: missing closing quote)
    {
      label: 'change: 💥 { invalid YAML (syntax) }',
      yaml: `
        foo:
          id: example-slug
          traits:
            - as: primary
              id: video-player
          props:
            primary:
              src: "video.mp4   # ← missing closing quote
      `,
    },

    // 🐷 unknown trait id (semantic error)
    {
      label: 'change: 🐷 { unknown trait id }',
      yaml: `
        foo:
          id: example-slug
          traits:
            - as: primary
              id: not-real
          props:
            primary:
              src: "video.mp4"
      `,
    },

    // 🐷 duplicate alias
    {
      label: 'change: 🐷 { duplicate alias }',
      yaml: `
        foo:
          id: example-slug
          traits:
            - as: primary
              id: video-player
            - as: primary
              id: video-player
          props:
            primary:
              src: "video.mp4"
      `,
    },

    // 🐷 missing props for alias
    {
      label: 'change: 🐷 { missing props for alias }',
      yaml: `
        foo:
          id: example-slug
          traits:
            - as: primary
              id: video-player
          props: {}
      `,
    },

    // 🐷 orphan props
    {
      label: 'change: 🐷 { orphan props }',
      yaml: `
        foo:
          id: example-slug
          traits:
            - as: primary
              id: video-player
          props:
            primary:
              src: "video.mp4"
            extra:
              note: "no matching trait alias"
      `,
    },

    // 🐷 invalid props shape
    {
      label: 'change: 🐷 { invalid props shape }',
      yaml: `
        foo:
          id: example-slug
          traits:
            - as: primary
              id: video-player
          props:
            primary:
              src: ""   # violates minLength: 1
      `,
    },
  ];

  return (
    <>
      {samples.map((s, i) => (
        <YamlSample key={i} debug={debug} label={s.label} yaml={s.yaml} />
      ))}

      <hr />
      {/* terminal break: set a non-string at the YAML doc path (forces reset) */}
      <Button
        block
        label={() => `change: 🧨 { terminal break } ← requires reset`}
        onClick={() => {
          changeYaml(({ draft, path }) => Obj.Path.Mutate.set(draft, path, { fail: '💥' }));
        }}
      />
    </>
  );
}

function YamlSample(props: { debug: DebugSignals; label: string; yaml: string }) {
  const { debug, label, yaml } = props;

  const changeYaml = (fn: (args: { draft: any; path: t.ObjectPath }) => void) => {
    const doc = debug.signals.doc.value;
    const path = debug.props.path.value;
    if (doc && path) doc.change((draft) => fn({ draft, path }));
  };

  return (
    <Button
      block
      label={label}
      onClick={() =>
        changeYaml(({ draft, path }) => Obj.Path.Mutate.set(draft, path, Str.dedent(yaml)))
      }
    />
  );
}
