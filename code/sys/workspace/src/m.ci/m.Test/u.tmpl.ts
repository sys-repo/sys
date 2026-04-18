export const TEST_JOB_CONFIG_TEMPLATE = `    name: \${{ matrix.name }}
    strategy:
      fail-fast: false
      matrix:
        include:
__MATRIX_ITEMS__`;

export const TEST_BODY_TEMPLATE = `      - name: Verify workspace graph
        run: deno task check:graph

      - name: test module → "\${{ matrix.name }}"
        run: |
          cd \${{ matrix.path }}
          deno task test`;

export const TEST_MATRIX_ITEM_TEMPLATE = `- name: "NAME"
  path: PATH`;
