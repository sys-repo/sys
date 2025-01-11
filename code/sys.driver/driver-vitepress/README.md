# VitePress Driver
Tools for working with the "[VitePress](https://vitepress.dev)" documentation SSG (static-site-generator).

- https://vitepress.dev
- See also [jsr:@sys/driver-vite](https://jsr.io/@sys/driver-vite)

<p>&nbsp;<p>

NB: \<UI Framework™️\> [agnostic](https://github.com/sys-repo/sys/edit/main/README.md#agnostic).

---

New (Initialize)

```bash
deno run -A jsr:@sys/driver-vitepress/init
```


<p>&nbsp;<p>

### Build Pipeline (Compilation Toolchain)

![diagram](https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/5d631b2e-8e76-4ec8-3ca2-d4943e70b100/original)



### Command Interface (Common)

```bash
deno task help

 ↓

Usage: deno task [COMMAND]
                                                                         
  deno task dev       Run the development server.                  
  deno task build     Transpile to production bundle.
  deno task serve     Run a local HTTP server with the production bundle.

  deno task upgrade   Upgrade to latest version.                    
  deno task backup    Take a snapshot of the project.
  deno task clean     Delete temporary files.
  deno task help      Show help.
```

### JSR Publishing
Before publishing to [JSR](https://jsr.io/@sys/driver-vitepress) ensure you update the
embedded templates file-map.

```
deno task prep
```

↑ updates template file changes into `src/-tmpl/u.tmpl/tmpl.bundle.json`
