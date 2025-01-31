# 👋 Hello

Generated with [`@sys/driver-vitepress@<DRIVER_VER>`](https://jsr.io/@sys/driver-vitepress@<DRIVER_VER>)


```yaml
debug: true
component: sys/tmp/ui:Foo
notes: |
  Should import: @sys/tmp@0.0.57/ui:<Foo> (WIP)
  Provies:
  - react rendering
  - import from system module (monorepo) via JSR.
  - correct aliasing of fully-qualified "import" text (eg: "npm:react:19.0.0" → "react")
```


```yaml
debug: true
component: ConceptPlayer
video: vimeo/727951677
timestamps: 
  '00:03:58.215': 
    image: https://wrpcd.net/cdn-cgi/imagedelivery/BXluQx4ige9GuW0Ia56BHw/28f5b7ed-67d1-419d-8db0-d95ae90e8100/rectcontain3
```



```yaml
debug: true
component: Video
src: vimeo/727951677
```

<p>&nbsp;</p>

---


# Markdown ( [Syntax](https://markdown-it.github.io/) )
A sample breakdown of the main markdown syntax options available...(🐷):


## H1 Header
### H2 Header
#### H3 Header
##### H4 Header

- **Bold text** and *italic text* can be emphasized.
- Lists:
  - Unordered item
  - Another item
    - Sub-item
    - Another sub-item
  - Third item
- Ordered list:
  1. First item
  2. Second item
  3. Third item

> Blockquotes are useful for highlighting text.

Inline `code` and code blocks:

```python
# Fenced code block example
print("Hello, World!")
```

Color syntax highlighting all major modern languages:

```ts
function foo(args:{ msg?: string } = {}): string {
  const { msg } = args
  return `Hello World${msg ? ` (${msg})` : ''} 👋`;
}
```


Links:  
[Ineternal link](#section) | [External link](https://example.com)  

Footnote reference[^1].

Tables:
| Header 1 | Header 2 |
|----------|----------|
| Row 1    | Data 1   |
| Row 2    | Data 2   |

[^1]: This is a footnote.

This is a paragraph with a [reference-style link][ref] and another [inline link](https://example.com).

[ref]: https://example.com "Optional title"
