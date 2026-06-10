export const JSR_MODULES_PLACEHOLDER = '__MODULES__';

export const JSR_JOB_CONFIG_TEMPLATE = `    timeout-minutes: 240`;

export const JSR_MAX_PARALLEL = 4;

export const JSR_BODY_TEMPLATE = `- name: publish module → "__NAME__"
  run: |
    cd __PATH__
    expected_pkg_name="__NAME__"
    expected_pkg_version="__VERSION__"
    pkg_name="$(deno eval "const c = JSON.parse(await Deno.readTextFile('deno.json')); console.log(c.name)")"
    pkg_version="$(deno eval "const c = JSON.parse(await Deno.readTextFile('deno.json')); console.log(c.version)")"
    if [ "$pkg_name" != "$expected_pkg_name" ]; then
      echo "::error::Generated JSR workflow package name is stale: expected \${expected_pkg_name}, found \${pkg_name}"
      exit 1
    fi
    if [ "$pkg_version" != "$expected_pkg_version" ]; then
      echo "::error::Generated JSR workflow package version is stale: expected \${expected_pkg_version}, found \${pkg_version}"
      exit 1
    fi
    pkg_meta_url="https://jsr.io/\${pkg_name}/\${pkg_version}_meta.json"
    publish_timeout="90s"
    publish_confirm_timeout=180
    publish_confirm_interval=10

    jsr_version_exists() {
      curl --fail --silent --location --max-time 30 --head "$pkg_meta_url" >/dev/null
    }

    wait_for_jsr_version() {
      elapsed=0
      while [ "$elapsed" -le "$publish_confirm_timeout" ]; do
        if jsr_version_exists; then
          return 0
        fi
        if [ "$elapsed" -ge "$publish_confirm_timeout" ]; then
          break
        fi
        sleep "$publish_confirm_interval"
        elapsed=$((elapsed + publish_confirm_interval))
      done
      return 1
    }

    deno task test --frozen
    git status --short
    test -z "$(git status --porcelain)"

    if jsr_version_exists; then
      echo "published version already exists on JSR: \${pkg_name}@\${pkg_version}"
      exit 0
    fi

    max_attempts=3
    for attempt in $(seq 1 $max_attempts); do
        if jsr_version_exists; then
          echo "published version already exists on JSR: \${pkg_name}@\${pkg_version}"
          exit 0
        fi
        if timeout --foreground --kill-after=30s "$publish_timeout" deno publish; then
          echo "deno publish exited successfully; confirming JSR registry visibility..."
          if wait_for_jsr_version; then
            echo "JSR registry confirms published version: \${pkg_name}@\${pkg_version}"
            exit 0
          fi
          echo "::error::deno publish exited successfully, but JSR registry confirmation was not observed: \${pkg_name}@\${pkg_version}"
          exit 1
        else
          status=$?
        fi
        if [ "$status" -eq 124 ]; then
          echo "deno publish reached bounded wait (\${publish_timeout}, exit code 124); checking JSR registry confirmation..."
        else
          echo "deno publish exited with code \${status}; checking JSR registry confirmation before retry/fail..."
        fi
        if wait_for_jsr_version; then
          echo "JSR registry confirms published version: \${pkg_name}@\${pkg_version}; treating publish as successful."
          exit 0
        fi
        if [ "$attempt" -lt "$max_attempts" ]; then
          delay=$((5 * 2 ** (attempt - 1)))
          echo "JSR registry did not confirm published version after attempt $attempt/$max_attempts; retrying in \${delay}s..."
          sleep "$delay"
        fi
    done
    echo "::error::Publish failed: deno publish did not complete successfully and JSR registry did not confirm published version after $max_attempts attempts: \${pkg_name}@\${pkg_version}"
    exit 1`;

export const JSR_MATRIX_BODY_TEMPLATE = JSR_BODY_TEMPLATE
  .replace('publish module → "__NAME__"', 'publish module → "${{ matrix.name }}"')
  .replace('cd __PATH__', 'cd "${{ matrix.path }}"')
  .replace('expected_pkg_name="__NAME__"', 'expected_pkg_name="${{ matrix.name }}"')
  .replace('expected_pkg_version="__VERSION__"', 'expected_pkg_version="${{ matrix.version }}"');
