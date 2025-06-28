// import type { t } from './common.ts';
//
// /* ── document shape expected inside the CRDT ────────────────────────────── */
//
// export type TextDoc = { text: unknown }; // string or Automerge.Text
//
// /* ── public API ─────────────────────────────────────────────────────────── */
//
// export type BindOptions = {
//   /** Live Monaco model (create it first) */
//   model: t.MonacoTextModel;
//   /** Immutable CRDT reference to a `{ text }` document */
//   ref: t.CrdtRef<TextDoc>;
//   /** Called after **local** edits have produced a new immutable ref */
//   onRefChange?: (next: t.CrdtRef<TextDoc>) => void;
// };
//
// export type Binding = {
//   /** Latest CRDT ref held by this binding */
//   readonly ref: t.CrdtRef<TextDoc>;
//   /** Remove listeners and return the final ref */
//   dispose(): t.CrdtRef<TextDoc>;
// };
//
// /* ── helper : read any “text-like” payload as a JS string ───────────────── */
//
// const toString = (src: unknown): string =>
//   typeof src === 'string' ? src : (src as { toString(): string }).toString?.() ?? String(src);
//
// /* ── core logic ─────────────────────────────────────────────────────────── */
//
// export const bindMonacoToCrdt = (opts: BindOptions): Binding => {
//   let { model, ref } = opts;
//
//   let ignoreModel = false; // suppress feedback when *we* edit Monaco
//   let ignoreCrdt = false; // suppress feedback when *we* edit CRDT
//
//   /* push CRDT → Monaco (one-way) */
//   const syncFromRef = (snapshot: t.CrdtRef<TextDoc>) => {
//     if (ignoreCrdt) return;
//     const text = toString(snapshot.current.text);
//     if (model.getValue() !== text) {
//       ignoreModel = true;
//       model.setValue(text); // cheap whole-doc path
//       ignoreModel = false;
//     }
//   };
//
//   /* 1️⃣ initial sync (CRDT ➜ Monaco) */
//   syncFromRef(ref);
//
//   /* 2️⃣ Monaco edits ➜ CRDT */
//   const disposeModel = model.onDidChangeContent((ev) => {
//     if (ignoreModel) return;
//
//     ref = ref.change((doc) => {
//       for (const c of ev.changes) {
//         const i = c.rangeOffset;
//
//         /* delete */
//         if (c.rangeLength > 0) {
//           if (typeof (doc.text as any).deleteAt === 'function') {
//             (doc.text as any).deleteAt(i, c.rangeLength); // Automerge.Text
//           } else {
//             const s = toString(doc.text);
//             doc.text = (s.slice(0, i) + s.slice(i + c.rangeLength)) as any;
//           }
//         }
//
//         /* insert */
//         if (c.text.length > 0) {
//           if (typeof (doc.text as any).insertAt === 'function') {
//             (doc.text as any).insertAt(i, ...c.text.split(''));
//           } else {
//             const s = toString(doc.text);
//             doc.text = (s.slice(0, i) + c.text + s.slice(i)) as any;
//           }
//         }
//       }
//     });
//
//     opts.onRefChange?.(ref);
//   });
//
//   /**
//    * TODO 🐷
//    */
//
//   /* 3️⃣ CRDT commits (local or remote) ➜ Monaco */
//   const unsubscribe = () => {
//     /**
//      * TODO 🐷
//      */
//   };
//   // const unsubscribe = ref.on((next) => {
//   //   ignoreCrdt = true;
//   //   ref = next; // advance local pointer
//   //   syncFromRef(ref);
//   //   ignoreCrdt = false;
//   // });
//
//   /* 4️⃣ teardown */
//   const dispose = () => {
//     disposeModel.dispose();
//     unsubscribe();
//     return ref;
//   };
//
//   return {
//     get ref() {
//       return ref;
//     },
//     dispose,
//   };
// };
//
// /* ── convenience factory : new doc + bind ──────────────────────────────── */
//
// export const createBoundText = (
//   model: t.MonacoTextModel,
//   make: () => t.CrdtRef<TextDoc>,
// ): Binding => bindMonacoToCrdt({ model, ref: make() });
