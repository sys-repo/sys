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
              path="$(realpath -- "$(command -v "$bin")")"
              case "$path" in
                *','*|*$'\\r'*|*$'\\n'*)
                  echo "::error::Chrome executable path is unsafe for Deno permission transport"
                  exit 1
                  ;;
              esac
              if [ ! -f "$path" ] || [ ! -x "$path" ] || [ -L "$path" ]; then
                echo "::error::Chrome executable is not a canonical regular executable"
                exit 1
              fi
              printf 'CHROME_BIN=%s\\n' "$path" >> "$GITHUB_ENV"
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
          deno task test

      - name: browser test module → "\${{ matrix.name }}"
        if: \${{ matrix.browser == true }}
        run: |
          cd \${{ matrix.path }}
          deno task test:browser`;

export const TEST_MATRIX_ITEM_TEMPLATE = `- name: "NAME"
  path: PATH`;
