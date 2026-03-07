export const BUILD_JOB_CONFIG_TEMPLATE = `    name: \${{ matrix.name }}
    strategy:
      fail-fast: false
      matrix:
        include:
__MATRIX_ITEMS__`;

export const BUILD_BODY_TEMPLATE = `      - name: build module → "\${{ matrix.name }}"
        run: |
          cd \${{ matrix.path }}
          deno task build`;

export const BUILD_MATRIX_ITEM_TEMPLATE = `- name: "NAME"
  path: PATH`;
