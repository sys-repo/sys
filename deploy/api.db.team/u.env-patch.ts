/**
 * Monkey Patch (for Deno).
 * Ensure the environment does not look like a browser.
 *
 * Ref:
 *    https://deno.com/blog/v2.0-release-candidate#changes-to-global-variables
 *
 * NOTE: should not be necessary after Deno-2.0 is fully released
 *       and used within the Deno Deploy cloud.
 */
delete (globalThis as any).window;
