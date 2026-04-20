# @sys/driver-agent
Agent driver adapters.

### Usage
```ts
import { pkg } from 'jsr:@sys/driver-agent';
```

### Invoking
```sh
deno run -A jsr:@sys/driver-agent/pi/cli Profiles
deno run -A jsr:@sys/driver-agent/pi/cli Profiles --profile canon

# (equivalent): from system tools ↓

deno run -A jsr:@sys/tools agent
deno run -A jsr:@sys/tools agent --profile canon
```

---

### Conceptual Primitives
Working frame for this package, not a universal industry definition of “agent.”

    <LLM> + shell + fs + markdown + cron == "agent" (🦞)  

<p>&nbsp;</p>

"Marrying the language-model mindset to the [Unix shell/prompt mindset](https://github.com/sys-repo/sys?tab=readme-ov-file#development-philosophy). **What is an agent?**" — [Marc Andreessen](https://www.youtube.com/watch?v=knx2wrILP1M&t=2121s)

It is:

- 🦞
 - ↑ `cron` job (loop, heartbeat)  
 - ↑ file-system, `fs` (state, .md)  
 - ↑ shell, `bash`  
 - ↑ language-model (LLM)


<p>&nbsp;</p>

---

### Pi Startup Policy

- `@sys/driver-agent/pi` requires launching inside a git repository.
- Startup walks upward from the starting directory to the nearest ancestor containing `.git`.
- That git root becomes the effective Pi launch cwd.
- Runtime state and launcher artifacts are anchored to that repo root, including:
  - `./.pi/`
  - `./.tmp/pi.cli/`
  - `./.log/@sys.driver-agent.pi/`


<p>&nbsp;</p>

----

### Refs

- Mario Zechner, [Pi](https://pi.dev/) creator - [ref:video](https://www.youtube.com/watch?v=Dli5slNaJu0)
- Lucas Meijer - [ref:video](https://www.youtube.com/watch?v=fdbXNWkpPMY) ("love letter to pi")
