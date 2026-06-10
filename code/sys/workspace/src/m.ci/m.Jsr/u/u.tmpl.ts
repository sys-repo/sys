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
    pkg_index_url="https://jsr.io/\${pkg_name}/meta.json"
    pkg_specifier="jsr:\${pkg_name}@\${pkg_version}"
    publish_timeout="90s"
    publish_confirm_timeout=180
    publish_confirm_interval=10

    jsr_exact_metadata_visible() {
      curl --fail --silent --location --max-time 30 --head "$pkg_meta_url" >/dev/null
    }

    jsr_package_index_visible() {
      deno eval '
        const [url, version] = Deno.args;
        const res = await fetch(url, {
          cache: "reload",
          headers: { "cache-control": "no-cache", pragma: "no-cache" },
        });
        if (!res.ok) Deno.exit(1);
        const data = await res.json();
        Deno.exit(data?.versions?.[version] ? 0 : 1);
      ' "$pkg_index_url" "$pkg_version" >/dev/null
    }

    deno_resolver_visible() {
      tmpdir="$(mktemp -d)"
      (
        cd "$tmpdir"
        deno info --reload "$pkg_specifier" >/dev/null
      )
    }

    wait_for_jsr_version() {
      elapsed=0
      exact_reported=0
      index_reported=0
      resolver_reported=0
      while [ "$elapsed" -le "$publish_confirm_timeout" ]; do
        if jsr_exact_metadata_visible; then
          if [ "$exact_reported" -eq 0 ]; then
            echo "JSR exact metadata is visible: \${pkg_name}@\${pkg_version}"
            exact_reported=1
          fi
          if jsr_package_index_visible; then
            if [ "$index_reported" -eq 0 ]; then
              echo "JSR package index includes published version: \${pkg_name}@\${pkg_version}"
              index_reported=1
            fi
            if deno_resolver_visible; then
              if [ "$resolver_reported" -eq 0 ]; then
                echo "Deno resolver confirms published version: \${pkg_name}@\${pkg_version}"
                resolver_reported=1
              fi
              return 0
            fi
            if [ "$resolver_reported" -eq 0 ]; then
              echo "JSR package index is visible, waiting for Deno resolver visibility: \${pkg_name}@\${pkg_version}"
              resolver_reported=1
            fi
          elif [ "$index_reported" -eq 0 ]; then
            echo "JSR exact metadata is visible, waiting for package index visibility: \${pkg_name}@\${pkg_version}"
            index_reported=1
          fi
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

    if jsr_exact_metadata_visible; then
      if wait_for_jsr_version; then
        echo "published version already has full JSR resolver visibility: \${pkg_name}@\${pkg_version}"
        exit 0
      fi
      echo "::error::Published version metadata exists, but JSR resolver visibility was not confirmed: \${pkg_name}@\${pkg_version}"
      exit 1
    fi

    max_attempts=3
    for attempt in $(seq 1 $max_attempts); do
        if jsr_exact_metadata_visible; then
          if wait_for_jsr_version; then
            echo "published version already has full JSR resolver visibility: \${pkg_name}@\${pkg_version}"
            exit 0
          fi
          echo "::error::Published version metadata exists, but JSR resolver visibility was not confirmed: \${pkg_name}@\${pkg_version}"
          exit 1
        fi
        if timeout --foreground --kill-after=30s "$publish_timeout" deno publish; then
          echo "deno publish exited successfully; confirming JSR resolver visibility..."
          if wait_for_jsr_version; then
            echo "JSR resolver confirms published version: \${pkg_name}@\${pkg_version}"
            exit 0
          fi
          echo "::error::deno publish exited successfully, but JSR resolver visibility was not confirmed: \${pkg_name}@\${pkg_version}"
          exit 1
        else
          status=$?
        fi
        if [ "$status" -eq 124 ]; then
          echo "deno publish reached bounded wait (\${publish_timeout}, exit code 124); checking JSR resolver visibility..."
        else
          echo "deno publish exited with code \${status}; checking JSR resolver visibility before retry/fail..."
        fi
        if wait_for_jsr_version; then
          echo "JSR resolver confirms published version: \${pkg_name}@\${pkg_version}; treating publish as successful."
          exit 0
        fi
        if jsr_exact_metadata_visible; then
          echo "::error::Published version metadata exists, but JSR resolver visibility was not confirmed: \${pkg_name}@\${pkg_version}"
          exit 1
        fi
        if [ "$attempt" -lt "$max_attempts" ]; then
          delay=$((5 * 2 ** (attempt - 1)))
          echo "JSR resolver did not confirm published version after attempt $attempt/$max_attempts; retrying in \${delay}s..."
          sleep "$delay"
        fi
    done
    echo "::error::Publish failed: deno publish did not complete successfully and JSR resolver did not confirm published version after $max_attempts attempts: \${pkg_name}@\${pkg_version}"
    exit 1`;

export const JSR_MATRIX_BODY_TEMPLATE = JSR_BODY_TEMPLATE
  .replace('publish module → "__NAME__"', 'publish module → "${{ matrix.name }}"')
  .replace('cd __PATH__', 'cd "${{ matrix.path }}"')
  .replace('expected_pkg_name="__NAME__"', 'expected_pkg_name="${{ matrix.name }}"')
  .replace('expected_pkg_version="__VERSION__"', 'expected_pkg_version="${{ matrix.version }}"');
