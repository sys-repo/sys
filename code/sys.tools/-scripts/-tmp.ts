import { backupConfig } from './-tmp.backup-config.ts';
import { mdFileToPdf } from './-tmp.pdf.ts';

// await backupConfig({ from: './.tmp/-config/', to: '~/code.data/-backup.from.sys-tmp/' });
// await backupConfig({ from: './.tmp/-config/', to: '../../-config/', snapshot: false, merge: true });

await mdFileToPdf('.tmp/SUMMARY.md');
