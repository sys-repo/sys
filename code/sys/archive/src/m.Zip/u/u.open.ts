import type { t } from '../common.ts';
import { copySource, openOptions, workOptions } from './u.input.ts';
import { operation, operationStart } from './u.operation.ts';
import { parseZip } from './u.parse.ts';
import { testPayloads } from './u.payload.ts';

/** Open and own one strict bounded ZIP32 archive. */
export async function open(
  input: Uint8Array,
  optionsInput: t.Zip.OpenOptions,
): Promise<t.Zip.Archive> {
  const started = operationStart();
  const options = openOptions(optionsInput);
  return await operation('open', options, options.limits, async (context) => {
    const bytes = copySource(input, options.limits);
    context.checkpoint();
    const parsed = await parseZip(bytes, options.limits, context);
    context.checkpoint();

    const archive: t.Zip.Archive = Object.freeze({
      inspect: () => parsed.inspection,
      test: async (testOptionsInput) => {
        const testStarted = operationStart();
        const testOptions = workOptions(testOptionsInput, options.limits.maxErrorChars);
        return await operation(
          'test',
          testOptions,
          options.limits,
          async (testContext) => await testPayloads(bytes, parsed.entries, testContext),
          testStarted,
        );
      },
    });
    return archive;
  }, started);
}
