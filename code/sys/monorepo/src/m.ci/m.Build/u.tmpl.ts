import { workflowTemplate } from '../u.workflow.ts';

export const BUILD_TEMPLATE = workflowTemplate({
  name: 'build',
  permissions: '      contents: read',
  jobConfig: `    strategy:
      fail-fast: false
      matrix:
        include:
__MATRIX_ITEMS__`,
  body: `      - name: build module → "\${{ matrix.name }}"
        run: |
          cd \${{ matrix.path }}
          deno task build`,
});

export const BUILD_MATRIX_ITEM_TEMPLATE = `- path: PATH
  name: "NAME"`;
