export * from './u.fmt/mod.ts';

// import { type t, Fmt as Base, c, Cli, D, Fs, Str, Time } from './common.ts';
// import { getConfig } from './u.config.ts';
// import { endpointValidation } from './u.fmt.validation.ts';
//
// export const Fmt = {
//   ...Base,
//   endpointValidation,
//
//   async help(toolname: string = D.tool.name, cwd: t.StringDir) {
//     const config = await getConfig(cwd);
//     const str = Str.builder()
//       .line(c.gray(`working dir: ${Fs.trimCwd(cwd)}`))
//       .line(await Base.help(toolname))
//       .line();
//
//     return String(str);
//   },
//
//   // 🌸🌸 ---------- CHANGED: endpointTable-mappings ----------
//
//   // 🌸🌸 ---------- CHANGED: endpointTable-mappings ----------
//
//   // 🌸🌸 ---------- CHANGED: endpointTable-mappings-below ----------
//
//   async endpointTable(ref: t.DeployTool.Config.EndpointRef, cwd: t.StringDir) {
//     const table = Cli.table();
//
//     const fmtTime = (ts?: t.UnixTimestamp) => {
//       if (!ts) return c.gray(c.dim('-'));
//       try {
//         return c.gray(`${String(Time.elapsed(ts))} ago`);
//       } catch {
//         return c.gray(String(ts));
//       }
//     };
//
//     const child = (label: string, isLast = false) => {
//       return c.gray(` ${c.dim(Fmt.Tree.branch(isLast))} ${label}`);
//     };
//
//     // Original table (unchanged).
//     table.body([
//       [c.gray(`Endpoint`), c.cyan(ref.name)],
//       [child(`file`), c.gray(c.dim(ref.file))],
//       [child(`created`), fmtTime(ref.createdAt)],
//       [child(`last used`, true), fmtTime(ref.lastUsedAt)],
//     ]);
//
//     let mappingsBlock = '';
//
//     try {
//       const abs = Fs.join(cwd, ref.file);
//       const res = await Fs.readYaml<{ mappings?: readonly t.DeployTool.Staging.Mapping[] }>(abs);
//       const mappings = res.ok ? (res.data?.mappings ?? []) : [];
//
//       if (mappings.length) {
//         const mt = Cli.table();
//
//         const flowFor = (m: t.DeployTool.Staging.Mapping) => {
//           const src = Fs.basename(m.dir.source);
//           return `${c.white(src)}\n${c.gray('↓')}\n${c.white(m.dir.staging)}`;
//         };
//
//         // Narrow, stacked rows (won’t widen the UI).
//         mt.body(
//           mappings.map((m: t.DeployTool.Staging.Mapping) => {
//             return [`- ${c.cyan(m.mode)}`, flowFor(m)];
//           }),
//         );
//
//         mappingsBlock = `\n\n${c.gray('mappings')}\n${Str.trimEdgeNewlines(String(mt))}`;
//       }
//     } catch {
//       // formatting must never throw
//     }
//
//     return Str.trimEdgeNewlines(String(table)) + mappingsBlock;
//   },
//
//   // 🌸 ---------- /CHANGED ----------
//
//   // 🌸 ---------- /CHANGED ----------
//
//   // 🌸 ---------- /CHANGED ----------
// } as const;
