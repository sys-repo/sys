export const TEST_JOB_CONFIG_TEMPLATE = `    name: \${{ matrix.name }}
    strategy:
      fail-fast: false
      matrix:
        include:
__MATRIX_ITEMS__`;

export const TEST_BODY_TEMPLATE = `      - name: 'Configure Browser Runtime: Chrome'
        if: \${{ matrix.browser == true }}
        run: |
          for bin in google-chrome google-chrome-stable chromium chromium-browser; do
            if command -v "$bin" >/dev/null 2>&1; then
              path="$(command -v "$bin")"
              echo "CHROME_BIN=$path" >> "$GITHUB_ENV"
              "$path" --version
              exit 0
            fi
          done
          echo "::error::Chrome/Chromium runtime not found"
          exit 1

      - name: Verify workspace graph
        run: deno task check:graph

      - name: test module → "\${{ matrix.name }}"
        run: |
          cd \${{ matrix.path }}
          deno task test`;

export const TEST_MATRIX_ITEM_TEMPLATE = `- name: "NAME"
  path: PATH`;
