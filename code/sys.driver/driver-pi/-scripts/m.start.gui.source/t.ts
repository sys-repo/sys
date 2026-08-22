import type { Keyboard, t } from './common.ts';

export type GuiDistSource = Readonly<{
  dir: t.StringAbsoluteDir;
  fetch(request: Request): Promise<Response>;
}>;

export type SourceRuntimeServer = Pick<Deno.HttpServer<Deno.NetAddr>, 'addr' | 'finished'>;

export type SourceServe = (
  options: Readonly<{
    hostname: string;
    port: number;
    signal: AbortSignal;
    onListen(address: Deno.NetAddr): void;
  }>,
  handler: (request: Request) => Response | Promise<Response>,
) => SourceRuntimeServer;

export type InterruptHandle = Readonly<{ dispose(): void }>;

export type GuiDistSourceStarted = Readonly<{
  addr: Deno.NetAddr;
  hostname: t.StringHostname;
  port: t.PortNumber;
  origin: t.StringUrl;
  finished: Promise<void>;
  close(): Promise<void>;
}>;

export type SourceStartDependencies = Readonly<{
  serve: SourceServe;
  bindInterrupt(onInterrupt: () => void): InterruptHandle;
  bindKeyboard: typeof Keyboard.bind;
  shutdownKeyboard: typeof Keyboard.shutdown;
  print(input: Readonly<{ dir: t.StringAbsoluteDir; manifest: t.StringUrl; quit: string }>): void;
}>;
