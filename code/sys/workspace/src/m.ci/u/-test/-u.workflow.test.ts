import { Yaml } from '@sys/yaml';
import { describe, Err, expect, it, Json, Str } from '../../../-test.ts';
import { workflowTemplate } from '../u.workflow.ts';

type WorkflowDoc = {
  readonly on: { readonly push: { readonly branches: readonly string[] } };
  readonly jobs: {
    readonly before: { readonly name: string };
    readonly deno: {
      readonly name: string;
      readonly env: { readonly EXAMPLE: string };
      readonly steps: readonly {
        readonly name?: string;
        readonly uses?: string;
        readonly run?: string;
      }[];
    };
  };
};

describe('workflowTemplate', () => {
  // These four forms expand in replacement strings even without capture groups.
  const replacements = [
    { token: '$$', meaning: 'dollar escape' },
    { token: '$&', meaning: 'matched text' },
    { token: '$`', meaning: 'text before the match' },
    { token: "$'", meaning: 'text after the match' },
  ];
  for (const { token, meaning } of replacements) {
    it(`${token} (${meaning}) → literal YAML and shell content`, () => {
      const value = `literal ${token} text`;
      const quoted = Json.stringify(value);
      const branch = `feature/${token}`;
      const yaml = workflowTemplate({
        name: 'literal-insertions',
        on: { push: { branches: [branch] } },
        permissions: { contents: `read # ${value}` },
        env: { EXAMPLE: quoted },
        beforeDenoJob: Str.dedent(`
          before:
            name: ${quoted}
            runs-on: ubuntu-24.04
            steps:
              - run: echo before
        `),
        jobConfig: `    name: ${quoted}`,
        body: Str.indent(
          Str.dedent(`
            - run: |-
                ${value}
          `),
          6,
        ),
      });
      const parsed = Yaml.parse<WorkflowDoc>(yaml);
      expect(parsed.error).to.eql(undefined);
      const doc = parsed.data;
      if (!doc) throw Err.std('Expected parsed workflow');

      expect(doc.on.push.branches).to.eql([branch]);
      expect(doc.jobs.before.name).to.eql(value);
      expect(doc.jobs.deno.name).to.eql(value);
      expect(doc.jobs.deno.env.EXAMPLE).to.eql(value);
      expect(doc.jobs.deno.steps.at(-1)?.run).to.eql(value);
      expect(yaml).to.include(`contents: read # ${value}`);
    });
  }

  it('clean-worktree checks are opt-in and follow checkout and dependency installation', () => {
    for (const verifyCleanCheckout of [false, true]) {
      const yaml = workflowTemplate({
        name: 'verification-steps',
        permissions: { contents: 'read' },
        verifyCleanCheckout,
        body: Str.indent(
          Str.dedent(`
            - name: Caller step
              run: echo caller
          `),
          6,
        ),
      });
      const parsed = Yaml.parse<WorkflowDoc>(yaml);
      expect(parsed.error).to.eql(undefined);
      const steps = parsed.data?.jobs.deno.steps.map((step) => step.name ?? step.uses);
      expect(steps, `verifyCleanCheckout=${verifyCleanCheckout}`).to.eql([
        'actions/checkout@v5',
        ...(verifyCleanCheckout ? ['Verify clean checkout'] : []),
        'Install ESM Runtime: Deno 2.x',
        'Install Dependencies',
        ...(verifyCleanCheckout ? ['Verify clean dependency install'] : []),
        'Workspace Info',
        'Deno Info',
        'Caller step',
      ]);
    }
  });
});
