import { workflowTemplate } from '../u.workflow.ts';

export const JSR_TEMPLATE = workflowTemplate({
  name: 'ci',
  permissions: [
    '      contents: read',
    '      id-token: write # The OIDC/ID token is used for authentication with JSR.',
  ].join('\n'),
  body: `__MODULES__`,
});

export const JSR_MODULE_TEMPLATE = `- name: publish module → "NAME"
  run: |
    cd PATH
    deno task test --trace-leaks
    max_attempts=5
    for attempt in $(seq 1 $max_attempts); do
        if deno publish --allow-dirty; then
          exit 0
        fi
        if [ "$attempt" -lt "$max_attempts" ]; then
          delay=$((5 * 2 ** (attempt - 1)))
          echo "publish failed (attempt $attempt/$max_attempts), retrying in \${delay}s..."
          sleep "$delay"
        fi
    done
    echo "publish failed after $max_attempts attempts"
    exit 1`;
