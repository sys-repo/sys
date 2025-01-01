# VitePress Driver
Tools for working with the "[VitePress](https://vitepress.dev)" documentation SSG (static-site-generator).

https://vitepress.dev

<p>&nbsp;<p>

---

<p>&nbsp;<p>

### Build Pipeline (Compilation Toolchain)

![diagram](https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/5d631b2e-8e76-4ec8-3ca2-d4943e70b100/original)


### Generator (Initialize)

```bash
deno run -A jsr:@sys/driver-vitepress/init
```

### Command Interface (Common API Surface)

```bash
deno task help

 ↓

Usage: deno task [COMMAND]
                                                                         
  deno task dev       Run the development server.                        
  deno task build     Transpile into production bundle.                   
  deno task serve     Run a local HTTP server with the production bundle.
  deno task upgrade   Upgrade to latest version.                         
  deno task help      Show help.              
```
