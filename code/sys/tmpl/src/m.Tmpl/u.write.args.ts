import { type t, Fs, Is } from './common.ts';

type O = Record<string, unknown>;

export type Changes = {
  excluded: t.TmplFileOperation['excluded'];
  filename?: string;
  text?: string;
  binary?: Uint8Array;
};

export async function createArgs(op: t.TmplFileOperation, ctx?: O) {
  const changes: Changes = { excluded: false };

  const { tmpl, target } = op.file;
  const exists = await Fs.exists(target.absolute);
  const isText = op.contentType === 'text';
  const isBinary = op.contentType === 'binary';

  const args: t.TmplProcessFileArgs = {
    contentType: op.contentType as any,
    get ctx() {
      return ctx;
    },
    get tmpl() {
      return tmpl;
    },
    get target() {
      return { ...target, exists };
    },
    get text() {
      if (!isText) return undefined;
      return { tmpl: op.text!.tmpl, current: op.text!.target.before };
    },
    get binary() {
      if (!isBinary) return undefined;
      const tmpl = op.binary!.tmpl;
      const current = op.binary!.target.before;
      return { tmpl, current } as any; // NB: type hack.
    },
    exclude(reason) {
      changes.excluded = typeof reason === 'string' ? { reason } : true;
      return args;
    },
    rename(filename) {
      changes.filename = filename;
      return args;
    },
    modify(input: any) {
      if (isText && typeof input !== 'string') {
        throw new Error(`Expected string content to update text-file: ${target.relative}`);
      }
      if (isBinary && !Is.uint8Array(input)) {
        throw new Error(`Expected Uint8Array content to update binary-file: ${target.relative}`);
      }
      if (isText) changes.text = input;
      if (isBinary) changes.binary = input;
      return args as any;
    },
  };
  return { args, changes } as const;
}
