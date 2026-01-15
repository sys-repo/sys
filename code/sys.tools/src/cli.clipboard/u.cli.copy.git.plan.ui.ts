import { c, Cli, Fs, Str, type t } from './common.ts';
import { logClipboardSummary, pathsToFileStrings } from './u.copy.ts';
import { type CopyPlan } from './u.cli.copy.git.plan.ts';

type SectionName = 'Added' | 'Modified' | 'Renamed' | 'Conflicts' | 'Removed' | 'Submodules';

type ChecklistRow = {
  readonly section: SectionName;
  readonly label: string;
  readonly value: string;
  readonly copyPath?: string;
  readonly isWarning?: boolean;
  readonly suffix?: string;
  readonly disabled?: boolean;
};

export async function selectAndCopyPlan(repoRootAbs: t.StringDir, plan: CopyPlan) {
  const totalEntries = sum(
    plan.add.length,
    plan.modify.length,
    plan.rename.length,
    plan.conflict.length,
    plan.remove.length,
    plan.submodule.length,
  );

  renderSummary(totalEntries, plan);

  if (totalEntries === 0) {
    console.info(c.gray('No changes detected.'));
    return;
  }

  const rows = buildRows(plan);
  const selectableRows = rows.filter((row) => !row.disabled);
  const options = rows.map((row) => ({
    name: `${row.section}: ${renderLabel(row)}`,
    value: row.value,
    checked: true,
    disabled: row.disabled,
  }));

  const selectedValues =
    (await Cli.Input.Checkbox.prompt<string>({
      message: 'Select files to copy:',
      options,
    })) ?? [];

  const selectedEntries = selectedValues.length;
  if (selectedEntries === 0) {
    console.info(c.gray('No items selected.'));
    return;
  }

  const selectedRows = rows.filter((row) => selectedValues.includes(row.value));
  const selectableValueSet = new Set(selectableRows.map((row) => row.value));
  const selectedSelectableCount = selectedValues.filter((value) =>
    selectableValueSet.has(value),
  ).length;
  const copyTargets: string[] = [];
  const seen = new Set<string>();
  for (const row of selectedRows) {
    if (!row.copyPath) continue;
    if (seen.has(row.copyPath)) continue;
    seen.add(row.copyPath);
    copyTargets.push(row.copyPath);
  }

  if (copyTargets.length === 0) {
    console.info(c.gray('No copyable targets selected (only removals/submodules).'));
    return;
  }

  const absPaths = copyTargets.map((path) => Fs.join(repoRootAbs, path));
  const bundle = await pathsToFileStrings(absPaths, repoRootAbs);
  Cli.copyToClipboard(bundle.text);
  logClipboardSummary(bundle);

  const skipped = copyTargets.length - bundle.fileCount;
  if (skipped > 0) {
    const label = Str.plural(skipped, 'file', 'files');
    console.info(c.yellow(`Skipped ${skipped.toLocaleString()} ${label} (read failures).`));
  }

  const confirmation = `Copied ${bundle.fileCount.toLocaleString()}/${copyTargets.length.toLocaleString()} copy targets`;
  console.info(c.green(confirmation));
  if (selectableRows.length > 0 && selectedSelectableCount !== selectableRows.length) {
    console.info(
      c.gray(
        `(${selectedSelectableCount.toLocaleString()} selected; ${selectableRows.length.toLocaleString()} available)`,
      ),
    );
  }
}

function buildRows(plan: CopyPlan): ChecklistRow[] {
  const rows: ChecklistRow[] = [];

  plan.add.forEach((path) => {
    rows.push({
      section: 'Added',
      label: path,
      value: `add:${path}`,
      copyPath: path,
    });
  });

  plan.modify.forEach((path) => {
    rows.push({
      section: 'Modified',
      label: path,
      value: `modify:${path}`,
      copyPath: path,
    });
  });

  plan.rename.forEach((entry) => {
    rows.push({
      section: 'Renamed',
      label: `${entry.from} → ${entry.to}`,
      value: `rename:${entry.from}:${entry.to}`,
      copyPath: entry.to,
    });
  });

  plan.conflict.forEach((path) => {
    rows.push({
      section: 'Conflicts',
      label: path,
      value: `conflict:${path}`,
      copyPath: path,
      isWarning: true,
    });
  });

  plan.remove.forEach((path) => {
    rows.push({
      section: 'Removed',
      label: path,
      value: `remove:${path}`,
      suffix: '(not copied)',
      disabled: true,
    });
  });

  plan.submodule.forEach((path) => {
    rows.push({
      section: 'Submodules',
      label: path,
      value: `submodule:${path}`,
      suffix: '(submodule; not copied)',
      isWarning: true,
      disabled: true,
    });
  });

  return rows;
}

function renderSummary(total: number, plan: CopyPlan) {
  const summaryParts = [
    `${plan.add.length.toLocaleString()} added`,
    `${plan.modify.length.toLocaleString()} modified`,
    `${plan.remove.length.toLocaleString()} removed`,
    `${plan.rename.length.toLocaleString()} renamed`,
    `${plan.conflict.length.toLocaleString()} conflicts`,
    `${plan.submodule.length.toLocaleString()} submodules`,
  ];

  console.info(c.cyan(`Plan: ${total.toLocaleString()} entries (${summaryParts.join(', ')})`));
  console.info(c.gray('Select files to copy (defaults to all)'));
}

function renderLabel(row: ChecklistRow) {
  const base = row.suffix ? `${row.label} ${row.suffix}` : row.label;
  if (row.isWarning) {
    return c.yellow(base);
  }
  if (!row.copyPath) {
    return c.gray(base);
  }
  return base;
}

function sum(...values: number[]) {
  return values.reduce((acc, next) => acc + next, 0);
}
