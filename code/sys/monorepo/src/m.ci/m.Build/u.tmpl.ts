export const BUILD_JOB_CONFIG_TEMPLATE = `    strategy:
      fail-fast: false
      matrix:
        include:
__MATRIX_ITEMS__`;

export const BUILD_BODY_TEMPLATE = `      - name: build module → "\${{ matrix.name }}"
        run: |
          cd \${{ matrix.path }}
          deno task build`;

export const BUILD_MATRIX_ITEM_TEMPLATE = `- name: "build: NAME"
  path: PATH`;
