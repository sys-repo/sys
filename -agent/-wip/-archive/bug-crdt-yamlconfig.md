Debug report (CRDT docs menu display names)

  Context:

  - Command: system/crdt:tools --debug
  - Run location: /Users/phil/code.data/
  - Config dir resolved by tool: /Users/phil/code.data/-config/@sys/tools/crdt/docs
  - Menu shows IDs only (no name suffix), despite YAML files containing name.

  Instrumentation added:

  - --debug flag for the tool, centralized logger in code/sys.tools/src/cli.crdt/u.log.ts.
  - Docs menu and repo menu now accept and use log (same logger) for debug output.
  - Docs debug now logs:
      - resolved docs dir
      - file count
      - per‑file invalid YAML details
      - missing name
      - raw YAML read status using Fs.readYaml (same parser as YamlConfig.menu)

  Files changed (debug instrumentation):

  - code/sys.tools/src/cli.crdt/u.log.ts
  - code/sys.tools/src/cli.crdt/m.cli.ts
  - code/sys.tools/src/cli.crdt/u.config.docs/u.menu.docs.ts
  - code/sys.tools/src/cli.crdt/u.config.repo/u.menu.ts
  - code/sys.tools/src/cli.crdt/t.namespace.ts (adds debug?: boolean)

  What we need next time:

  - Run system/crdt:tools --debug and capture any of:
      - raw yaml read failed: ...
      - raw missing name: ...
      - invalid doc yaml: ...
  - If raw read fails, it implicates the YAML parser used by YamlConfig.menu (encoding/format issue).
  - If raw read succeeds but raw missing name appears, the parsed doc lacks name, implying file content or parse
    conversion issue.
  - If no debug warnings, but names still missing, the issue is likely in menu rendering or label formatting.

  Status:

  - Debug logging is now in place and uses a consistent logger.
