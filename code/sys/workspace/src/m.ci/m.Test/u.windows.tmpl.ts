export const WINDOWS_TEST_WORKFLOW_TEMPLATE = `name: test:windows

__ON__

jobs:
  deno:
    runs-on: windows-2025
    permissions:
      contents: read
    defaults:
      run:
        shell: pwsh
    name: \${{ matrix.name }}
    strategy:
      fail-fast: false
      matrix:
        include:
__MATRIX_ITEMS__
    steps:
      - uses: actions/checkout@v5
      - name: 'Install ESM Runtime: Deno 2.x'
        uses: denoland/setup-deno@v2
        with:
          deno-version: __DENO_VERSION__
      - name: Install Dependencies
        run: deno task install
      - name: Workspace Info
        run: deno task info
      - name: Verify workspace graph
        run: deno task check:graph
      - name: Deno Info
        run: deno info && deno --version
      - name: 'test:windows module → "\${{ matrix.name }}"'
        working-directory: \${{ matrix.path }}
        run: deno task test:windows`;
