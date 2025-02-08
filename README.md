![banner-A1-slender](https://github.com/cellplatform/platform-0.2.0/assets/185555/2b0a110d-0c73-4583-bbfa-94f77d38bc17)
[![jsr-scope][jsr-scope-image]][jsr-scope-url]
[![ci][ci-image]][ci-url]
[![ci-jsr][ci-jsr-image]][ci-jsr-url]

[mit-image]: https://img.shields.io/badge/license-MIT-blue.svg
[mit-url]: https://opensource.org/licenses/mit

[jsr-scope-image]: https://jsr.io/badges/@sys
[jsr-scope-url]: https://jsr.io/@sys

[ci-image]: https://github.com/sys-repo/sys/actions/workflows/ci.yaml/badge.svg
[ci-url]: https://github.com/sys-repo/sys/actions/workflows/ci.yaml

[ci-jsr-image]: https://github.com/sys-repo/sys/actions/workflows/jsr.yaml/badge.svg
[ci-jsr-url]: https://github.com/sys-repo/sys/actions/workflows/jsr.yaml


Monorepo comprising the core set of shared `/sys` "system" modules that flexibly compose into varying arrangements of (1) extremely-late-bound, (2) strongly typed, (3) decentralised, "cell like" functional processes.

- modules: [sys](/code/sys/) ← standard libs
- modules: [sys.ui](/code/sys.ui/)
- modules: [sys.driver](/code/sys.driver/)
- build toolchain (output → W3C/ECMA standards)

<p>&nbsp;</p>

[![licence][mit-image]][mit-url]  
Built on, and mission-locked to modern, portable, [Web Standards](https://wintercg.org/). ( ✊🏻💯 )

---

<p>&nbsp;</p>


![pre-release](https://img.shields.io/badge/status-pre--release-orange.svg)  
**Sustained long range R&D**  
Architecture, API's, and other conceptual primmitives will change (almost certainly radically 🐷) prior to any `1.x`.  

|     | repo                     | status
| --- | :---                     | :---
|  ●  | sys 🧫                    | current
|  ○  | ↑ platform-0.2.0         | [previous](https://github.com/cellplatform/platform-0.2.0)
|  ○  | ↑ platform-0.1.0         | [previous](https://github.com/cellplatform/platform-0.1.0)


<p>&nbsp;</p>
<p>&nbsp;</p>

---

# Immutable\<T\>
General immutability pattern.  
See full type definitions: [`@sys/types`](code/sys/types/src/types/t.Immutable.ts)

In its basic usage pattern:
```ts
type T = { count: number }

foo.current;                       //  === { count: 0 }    ↓
foo.change((d) => d.count = 123);  //   Σ  |               ← safe mutation
foo.current;                       //  === { count: 123 }  ↓              ..(next instance)
```


...and with a more flavor to the shape and characteristics of the `Immutable<T>` design pattern primitive (which is used extensively across the system for strongly typed manipulation of state).  

A broad number of diverse (and divergent) systems can be driven by this one single
"safe" state manipulation pattern.

Below shows how an `Immutable<T>` of `JSON` is declared, listened to, manipulated, and then ultimately disposed of (lifecycle):


```ts
type Immutable<T> = {
  current: T
  change(fn: Mutator<T>): void
  listen(): Events<T>
}

type T = { count: number }

// Generator<T> over some immutability strategy 
// (typically an external library's implementation, see namespace: `@sys/driver-*`), eg. "crdt" etc.
const foo = Generator.create<T>({ count: 0 }) // ← Immutable<T>

/**
 * Imutable change pattern.
 * (safely mutate a proxy).
 */
foo.current;                       //  === { count: 0 }    ↓
foo.change((d) => d.count = 123);  //   Σ  |               ← safe mutation
foo.current;                       //  === { count: 123 }  ↓


// Strongly typed Event<T> stream observable: 💦
const events = thing.listen(): Events<T>
events.$.subscribe((e) => { /* handle event stream */ });

/**
 * ↑ 💦
 * 
 * Stream of Patch<T> changes optionally available, 
 * eg. "RFC-6902 JSON patch standard".
 * 
 * The Events<T> library itself enshrines the meaning of the message stream 
 * conceptually through domain specific, pre-canned, stongly typed properties 
 * and methods of functional filters/helpers.
 */

// Finished.
events.dispose();
```

<p>&nbsp;</p>
<p>&nbsp;</p>


# Philosophy ← (Dev)

>> Open System.  
   Open Commons.  

---

[Doug McIlroy's](https://en.wikipedia.org/wiki/Douglas_McIlroy) as quoted by [Salus](https://en.wikipedia.org/wiki/Peter_H._Salus) in "[A Quarter Century of Unix](https://www.google.co.nz/books/edition/_/ULBQAAAAMAAJ?hl=en&gbpv=0)" ([ref](https://blog.izs.me/2013/04/unix-philosophy-and-nodejs/)):

- Write programs that do one thing and do it well.
- Write programs to work together.
- Write programs to handle text streams, because that is a universal interface.

<p>&nbsp;</p>

[Doug McIlroy's](https://en.wikipedia.org/wiki/Douglas_McIlroy) 4-point formulation of the [Unix Philosophy](http://www.catb.org/esr/writings/taoup/html/ch01s06.html):

1. **Make each program do one thing well.**  
   To do a new job, build afresh rather than complicate old programs by adding new features.

2. **Expect the output of every program to become the input to another, as yet unknown, program.**  
   Don’t clutter output with extraneous information. Avoid stringently columnar or binary input formats. Don’t insist on interactive input.

3. **Design and build software, even operating systems, to be tried early, ideally within weeks.**  
   Don’t hesitate to throw away the clumsy parts and rebuild them.

4. **Use tools in preference to unskilled help to lighten a programming task**,  
   Even if you have to detour to build the tools and expect to throw some of them out after you’ve finished using them.

<p>&nbsp;</p>

#### Subjective Measures of Quality (Design / System Engineering):

- [Modularity](https://en.wikipedia.org/wiki/Modularity)
- [Cohesion](https://en.wikipedia.org/wiki/Cohesion_(computer_science))
- (Good) [Seperation of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns)
- (Good) Lines of [Abstraction](https://en.wikipedia.org/wiki/Abstraction_(computer_science)) ← aka. [information hiding](https://en.wikipedia.org/wiki/Information_hiding)
- [Loose Coupling](https://en.wikipedia.org/wiki/Loose_coupling)

<p>&nbsp;</p>


>> **"libraries not frameworks"**  
>> An orientation toward framework agnosticism (which is the choise **default** in most circumstances). 
>> Then levered by a simple/strict extensino pattern, (eg. "drivers") as appropriate to the module's domain, technology, and constraints.

<p>&nbsp;</p>

# Philosophy ← (Design)
"Extracting energy from the [turing tarpit](https://en.wikipedia.org/wiki/Turing_tarpit)" ([Alan Kay](https://www.youtube.com/watch?v=Vt8jyPqsmxE&t=8s))

![kay-pure-relationships](https://user-images.githubusercontent.com/185555/186360463-cfd81f46-3429-4741-bbb3-b32015a388ac.png)

"Architecture can transcend architecture" - (Turing ← [Alan Kay](https://youtu.be/Vt8jyPqsmxE?t=555))

![func](https://user-images.githubusercontent.com/185555/185738258-68e54981-0eb8-49b8-b8a8-a64b1ac45023.png)

<p>&nbsp;</p>
<p>&nbsp;</p>

---

### Ideas, history, context:

- [video](https://www.youtube.com/watch?v=Ud8WRAdihPg) Alan Kay, "Learning and Computer Science", 1970s, [video](https://www.youtube.com/watch?v=YyIQKBzIuBY) Alan Kay, 2011, "Programming and Scaling"
- [paper](https://github.com/philcockfield/Papers/raw/main/Alan%20Kay/Kay%20-%20Opening%20the%20Hood%20of%20a%20Word%20Processor.pdf) Alan Kay, 1984, "Opening the Hood of a Word Processor"
- [video](https://www.youtube.com/watch?v=cmi-AXKvx30&t=323s) David Clark (1960's vs. 1970/80's)  
  "But what's interesting, is once the engineers got a hold, the visionaries went away ([timestamp](https://www.youtube.com/watch?v=cmi-AXKvx30&t=253s))"
- [video](https://www.youtube.com/watch?v=-C-JoyNuQJs) Crockford (2011) - "JSON [as the] intersection of all modern programming languages ([timestamp](https://youtu.be/-C-JoyNuQJs?t=741))"
- [video](https://youtu.be/0fpDlAEQio4?t=2641) SmallTalk (1976, 1980), only three primitive concepts. Everything is an object*, everything is a "message", be as extremely late-bound as possible. Build everything else up and out of that (aka. LISP-ey).


*NB: "object" meaning the original SmallTalk conception of "object," not the later "OOP" notions that emerged in the following decades ([ref.related](https://youtu.be/o4Xgx7bg3Lg?t=118)).

<img width="710" alt="image" src="https://user-images.githubusercontent.com/185555/230206000-abc1c9bf-8ef4-477c-9740-53fd4a4c8186.png">

[Augmenting Human Intellect](https://www.dougengelbart.org/content/view/138/): A Conceptual Framework  
1962, Douglas C. Engelbart, SRI Summary Report - [ref](https://www.dougengelbart.org/content/view/138/)

<p>&nbsp;</p>

>> “We refer to a way of life in an integrated domain where hunches, **cut-and-try**, intangibles and **human “feel for a situation”** usefully co-exist with powerful concepts, streamlined terminology and notation, sophisticated methods, and high-powered electronic aids.

---

<p>&nbsp;</p>

## Human Systems 
(aka. the "all of us"). Diverse social/relational networks of people, across scales. "People" not "users."  
Initial high fidelity design emphasis on the `1:1` (dyad) and `1:3` (tradic tendencies) as graph/network primitives.

<p>&nbsp;</p>

<img width="1999" alt="smor-model-group-scale-n-dimension-cell" src="https://github.com/cellplatform/platform-0.2.0/assets/185555/58aa1409-d745-4b6c-a20b-828d6858437a">


<p>&nbsp;</p>

**Identity** is not one simple reductive thing (or a "rented" database ID owned by some arbitrary vendor).  Each and every one of us inhabit many contexturally dependent and diverse identities.  Overall system design must ultimately bridge all the way to that complexity if it is to be of enduring value.    
“I am large, I contain multitudes” - [1892, Walt Whitman](https://en.wikipedia.org/wiki/Song_of_Myself)  


<p>&nbsp;</p>

### Gall's Law

>> A ***complex*** system that *works* is invariably found to have evolved from a ***simple*** system that *worked*. - [ref](https://en.wikipedia.org/wiki/John_Gall_(author))

The inverse proposition also appears to be true:

>> A complex system designed from scratch *never works* ***and cannot be made to work.***  You have to start over, beginning with a *simple system that works.*

<p>&nbsp;</p>

![smor-sys crdt-cell-timeline](https://github.com/cellplatform/platform-0.2.0/assets/185555/588f6c58-3e94-4818-8ada-cb333822025d)


<p>&nbsp;</p>

---

<p>&nbsp;</p>

### Runtime, Build Toolchain

"Framework" agnostic. [Web standards](https://wintercg.org/).

![image](https://github.com/user-attachments/assets/853a68bb-060d-4c64-be19-094e75b39523)



<p>&nbsp;</p>
<p>&nbsp;</p>
<p>&nbsp;</p>

# [MIT](LICENSE.md).

To understand the legal and historical context around the MIT Licence  
and it's enduring importance as "an open-source classic", see **Kyle E. Mitchell's**  
"[The MIT License line-by-line.](https://writing.kemitchell.com/2016/09/21/MIT-License-Line-by-Line.html) 171 words every programmer should understand."

<p>&nbsp;</p>

