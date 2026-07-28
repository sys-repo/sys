import { describe, expect, expectError, FileMap, Fs, it } from './common.ts';
import { json } from '../-bundle/-bundle.ts';
import { WorkspaceHelp } from '../mod.ts';
import { HelpResource } from '../u/u.paths.ts';

describe('WorkspaceHelp', () => {
  describe('resource graph', () => {
    it('loads root package help resources', async () => {
      const root = await WorkspaceHelp.Root.load();

      expect(root.summary).to.contain('@sys/workspace');
      expect(root.sections.map(({ label }) => label)).to.eql(['Rule', 'Maintenance']);
      root.sections.forEach((section) => expect(section.items.length).to.be.greaterThan(0));
    });

    it('loads the root DSL chapter', async () => {
      const chapter = await WorkspaceHelp.Dsl.load();

      expect(chapter.id).to.eql('dsl');
      expect(chapter.path).to.eql([]);
      expect(chapter.title).to.eql('Workspace DSL');
      expect(chapter.sections.map(({ label }) => label)).to.eql([
        'Reading protocol',
        'Rule',
        'Command surfaces',
      ]);
      expect(chapter.chapters.map(({ id, path }) => ({ id, path }))).to.eql([
        { id: 'delta', path: ['delta'] },
        { id: 'test', path: ['test'] },
      ]);
    });

    it('loads the delta DSL chapter', async () => {
      const chapter = await WorkspaceHelp.Dsl.load(['delta']);

      expect(chapter.id).to.eql('delta');
      expect(chapter.path).to.eql(['delta']);
      expect(chapter.sections.map(({ label }) => label)).to.eql([
        'Concept',
        'Bump since',
        'Explain delta',
        'Classification',
        'Closure',
      ]);
      expect(chapter.chapters).to.eql([]);
    });
  });

  describe('test-runner contract', () => {
    it('loads metadata and the pedagogical section map', async () => {
      const chapter = await WorkspaceHelp.Dsl.load(['test']);

      expect(chapter.id).to.eql('test');
      expect(chapter.path).to.eql(['test']);
      expect(chapter.title).to.eql('Workspace Test Runner');
      expect(chapter.summary).to.eql('Schedule tests; report truthful handoffs.');
      expect(chapter.sections.map(({ label }) => label)).to.eql([
        'Baseline',
        'Parallel control',
        'Flag boundary',
        'Scheduler truth',
        'Output ownership',
        'Screen lifecycle',
        'Failure handoff',
        'Native test telemetry',
      ]);
      expect(chapter.chapters).to.eql([]);
    });

    it('pins scheduler order and run-through semantics', async () => {
      const chapter = await WorkspaceHelp.Dsl.load(['test']);
      const scheduler = chapter.sections.find(({ label }) => label === 'Scheduler truth');
      expect(scheduler?.items).to.eql([
        'Parallel execution respects persisted workspace graph order and edges; it uses topological-frontier scheduling, not unordered package fan-out.',
        'Missing package test tasks are terminal `skipped` outcomes that can unlock dependents.',
        'Package failures remain actionable in the dedicated live failure index and do not stop new launches; every selected package test runs through to a terminal result.',
        'Live completed rows use newest-first scheduler terminal-event order. Each new row enters at top-left; prior visible rows shift row-major toward bottom-right; the oldest moves into `... +N more`.',
        'Passed, failed, skipped, and blocked rows share this order. Repaints preserve retained order; status, graph position, path, elapsed time, and test count never reorder it.',
        'Dependency edges delay a dependent until its predecessors finish; predecessor failure does not suppress the dependent package test.',
        'Final result package rows and canonical failure selection use graph order, not live completion recency.',
      ]);
    });

    it('pins output ownership and the screen lifecycle', async () => {
      const chapter = await WorkspaceHelp.Dsl.load(['test']);
      const output = chapter.sections.find(({ label }) => label === 'Output ownership');
      expect(output?.items).to.eql([
        'Sequential runs inherit child stdio for package-level debugging.',
        'Parallel workers buffer child stdout/stderr and preserve both streams on `WorkspaceRun.Result`.',
        'The parallel reporter renders scheduler-derived progress and a minimal live failed-package rerun index; it never renders failed-case identities, messages, excerpts, or buffered child streams.',
        "For direct parallel API calls, `reporter: 'screen' | 'log'` selects terminal behavior. `reporter: { mode: 'screen', onComplete }` selects the same screen behavior and receives final-frame visibility after persistence. Omission detects whether stdout is a terminal.",
        'The root task owns final presentation. Interactive parallel runs clear the visible stdout viewport once before graph output, use screen reporter mode, and append a compact handoff that omits actions already visible above it. Noninteractive parallel runs use log reporter mode and a full handoff. Sequential runs retain `Workspace.Run.Fmt.result(...)`.',
      ]);

      const screen = chapter.sections.find(({ label }) => label === 'Screen lifecycle');
      expect(screen?.items).to.eql([
        "Screen mode owns one coherent width/height viewport snapshot, adopts each resize event's exact `after` snapshot, and bounds every active frame by terminal cells and physical rows.",
        'Viewport contraction changes projection only. Expansion restores retained completions and failed-package actions without reordering.',
        'Bounded continuation summaries use the exact ASCII grammar `... +N more[ qualifier]`. Running counts are cyan, completed counts carry hidden-set severity, and failed-package or failed-test counts are red.',
        'On completion, screen mode stops animation and repaints the latest bounded frame once. After that repaint succeeds, it reports visible and total counts for graph-ordered failed-package actions in the exact frame. The root then appends the final handoff as ordinary output without remeasuring the viewport.',
      ]);
    });

    it('pins final handoff, diagnostic, and telemetry vocabulary', async () => {
      const chapter = await WorkspaceHelp.Dsl.load(['test']);
      const handoff = chapter.sections.find(({ label }) => label === 'Failure handoff');
      expect(handoff?.items).to.eql([
        '`Workspace.Run.Fmt.handoff(result, { detail, screen?, terminal?, width? })` formats one deterministic final handoff. `detail` is `compact` or `full`; `screen` accepts the persisted-frame receipt so compact output can omit repair items already visible above, while full detail ignores it.',
        'Every final handoff places one green or red horizontal rule at the resolved handoff width directly between its title and aggregate summary. Width is resolved once; color follows result status.',
        'A failed package finish immediately adds a minimal actionable item beneath the live completed-results grid, and that item persists while later packages complete.',
        "Repair items follow persisted graph order and include failed packages only; blocked outcomes remain aggregate facts, not rerun targets. Compact handoffs treat the receipt's visible count as a graph-ordered prefix and append only the remaining suffix. A missing, malformed, or total-mismatched receipt falls back to every repair item.",
        'Live and compact items contain exactly the package path, a positive observed failed-test count or process signal/exit fact, and the exact package-local rerun command.',
        'Failed-case identities, messages, ANSI-free output excerpts, stdout, and stderr are full/log-only diagnostic evidence and never appear in live or compact output.',
        'Observed failure counts without case records remain counts; unsupported or unavailable reports fall back to process signal or exit without invented test facts.',
        'Width fitting may wrap the rerun command, but it must never truncate or rewrite `deno task --cwd ./<package-path> <task>`.',
        'Full detail preserves the same minimal repair index, then adds bounded structured cases or conservative output evidence and every nonempty buffered stdout/stderr stream from failed packages.',
      ]);

      const telemetry = chapter.sections.find(({ label }) => label === 'Native test telemetry');
      expect(telemetry?.items).to.contain(
        'Internal report states are observed, unavailable, and unsupported. Aggregate operator output says collected, unavailable, and not applicable. Composite or no-op tasks remain successful package runs when their processes succeed.',
      );
    });
  });

  describe('bundle authority', () => {
    it('keeps authored resources byte-identical to the embedded bundle', async () => {
      expect(Object.keys(json)).to.eql([...HelpResource.Source.Files].sort());

      const root = Fs.resolve(import.meta.dirname ?? '.', '..');
      for (const file of HelpResource.Source.Files) {
        const source = await Fs.readText(Fs.join(root, file));
        if (!source.ok) throw source.error;
        expect(FileMap.Data.decode(json[file])).to.eql(source.data);
      }
    });
  });

  describe('failure reporting', () => {
    it('reports unknown DSL chapter paths clearly', async () => {
      const error = await expectError(() => WorkspaceHelp.Dsl.load(['missing']));

      expect(error.message).to.eql('WorkspaceHelp: DSL chapter not found: missing');
    });
  });
});
