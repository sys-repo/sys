# @sys/tools
Common system tools index (with Programmatic and CLI entry-points).


<p>&nbsp;</p>

## Setup

To install and view the base library help (including the optional shell command for your `~/.zshrc`):
```
deno run -E jsr:@sys/tools --help
```

To update to the latest version:
```bash
deno cache --reload jsr:@sys/tools
```



<p>&nbsp;</p>


## Tools

```bash
System Tools
 ├─ @sys/tools          <version>
 ├─ @sys/tools/copy     (← alias cp, clipboard)
 ├─ @sys/tools/crdt
 ├─ @sys/tools/video
 ├─ @sys/tools/serve
 └─ @sys/tools/update
```

<p>&nbsp;</p>


#### Video
```bash
deno run -A jsr:@sys/tools/video
```


#### Copy to Clipboard
```bash
deno run -A jsr:@sys/tools/copy
deno run -A jsr:@sys/tools/cp
```

#### CRDT (Conflict-Free Replicated Datatype)

```bash
deno run -A jsr:@sys/tools/crdt
```

#### Filesystem
```bash
deno run -A jsr:@sys/tools/fs
```

#### Update (Self)
```bash
deno run -A jsr:@sys/tools/update
```



<p>&nbsp;</p>

## Shell Alias
To enable the `sys` command globally, add the following to your `~/.zshrc`:

```
# ------------------------------------------------------------------------
# @sys: tools
# ------------------------------------------------------------------------
sys() {
  # Run the root tool if there are no arguments or if the first argument is a flag
  if (( $# == 0 )) || [[ "$1" == -* ]]; then
    deno run -A jsr:@sys/tools "$@"
    return
  fi

  # Otherwise, treat the first argument as the subcommand
  local sub="$1"
  deno run -A "jsr:@sys/tools/${sub}" "${@:2}"
}
```
