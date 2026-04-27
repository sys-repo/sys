export const TEST_JOB_CONFIG_TEMPLATE = `    name: \${{ matrix.name }}
    env:
      FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true
    strategy:
      fail-fast: false
      matrix:
        include:
__MATRIX_ITEMS__`;

export const TEST_BODY_TEMPLATE = `      - name: 'Install Browser Runtime: Chrome'
        if: \${{ matrix.browser == true }}
        id: setup-chrome
        uses: browser-actions/setup-chrome@v1

      - name: Configure Browser Runtime
        if: \${{ matrix.browser == true }}
        run: echo "CHROME_BIN=\${{ steps.setup-chrome.outputs.chrome-path }}" >> "$GITHUB_ENV"

      - name: Verify workspace graph
        run: deno task check:graph

      - name: test module → "\${{ matrix.name }}"
        run: |
          cd \${{ matrix.path }}
          deno task test`;

export const TEST_MATRIX_ITEM_TEMPLATE = `- name: "NAME"
  path: PATH`;
