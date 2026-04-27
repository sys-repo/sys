import type { t } from './common.ts';

export function collectBrowserErrors(errors: string[], sessionId: string) {
  return (msg: t.Browser.Chrome.Cdp.Message) => {
    if (msg.sessionId !== sessionId) return;
    const params = objectParams(msg.params);
    if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(runtimeExceptionText(params));
    }
    if (msg.method === 'Runtime.consoleAPICalled' && params.type === 'error') {
      errors.push(consoleArgsText(params.args));
    }
    if (msg.method === 'Log.entryAdded') {
      const entry = objectParams(params.entry);
      if (entry.level === 'error') errors.push([entry.text, entry.url].filter(Boolean).join(' '));
    }
  };
}

function runtimeExceptionText(params: Record<string, unknown>) {
  const detail = objectParams(params.exceptionDetails);
  const exception = objectParams(detail.exception);
  return stringOr(exception.description, detail.text, 'Runtime.exceptionThrown');
}

function consoleArgsText(input: unknown) {
  return Array.isArray(input) ? input.map((item) => argText(item)).join(' ') : '';
}

function argText(input: unknown) {
  const arg = objectParams(input);
  return stringOr(arg.value, arg.description, '');
}

function stringOr(...values: readonly unknown[]) {
  for (const value of values) {
    if (typeof value === 'string') return value;
  }
  return '';
}

function objectParams(input: unknown): Record<string, unknown> {
  return typeof input === 'object' && input !== null ? input as Record<string, unknown> : {};
}
