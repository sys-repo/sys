export const BUILD_HEADER_TEMPLATE = `name: build

on:
  push:
    branches:
      - main
      - phil-work

jobs:
  deno:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    environment: dev
    env:
      TEST_SAMPLE: \${{ vars.TEST_SAMPLE }}
      DENO_SUBHOSTING_ACCESS_TOKEN: \${{ secrets.DENO_SUBHOSTING_ACCESS_TOKEN }}
      DENO_SUBHOSTING_DEPLOY_ORG_ID: \${{ vars.DENO_SUBHOSTING_DEPLOY_ORG_ID }}
      PRIVY_APP_ID: \${{ vars.PRIVY_APP_ID }}
      PRIVY_APP_SECRET: \${{ secrets.PRIVY_APP_SECRET }}
    strategy:
      fail-fast: false
      matrix:
        include:
__MATRIX_ITEMS__

    steps:
      - uses: actions/checkout@v3

      - name: 'Install ESM Runtime: Deno 2.x'
        uses: denoland/setup-deno@v1
        with:
          deno-version: v2.5.x

      - name: 'Install ES Modules from JSR: https://jsr.io/@sys'
        run: deno task help

      - name: Deno Info
        run: deno info && deno --version

      - name: System Info
        run: deno task help

      - name: build module → "\${{ matrix.name }}"
        run: |
          cd \${{ matrix.path }}
          deno task build`;
