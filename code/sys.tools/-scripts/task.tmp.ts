import { mdFileToPdf } from './-tmp.pdf.ts';
import { sendMailSample } from './-tmp.send-email.ts';
import { backupCodexJsonl } from './-tmp.backup-codex.ts';

// await sendMailSample();
// await mdFileToPdf('.tmp/SUMMARY.md');

import { backupConfig } from './-tmp.backup-config.ts';
await backupConfig({ from: './.tmp/-config/', to: '~/code.data/-backup.from.sys-tmp/' });
await backupCodexJsonl();
