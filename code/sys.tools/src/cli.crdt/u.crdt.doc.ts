import { type t, c, Delete, Str, Time } from './common.ts';
import { setWatchingName } from './u.crdt.mutate.ts';
import { Fmt } from './u.fmt.ts';
import { promptDocumentListSelection, promptForDocumentId, promptName } from './u.prompt.ts';

/**
 * Add a document to the index.
 */
export async function addDoc(index: t.CrdtIndexDocRef) {
  const docid = await promptForDocumentId();
  const name = await promptName();

  const items = index.current.watching ?? [];
  const itemIndex = items.findIndex((m) => m.docid === docid);
  const item = items[itemIndex];
  const exists = !!item;

  if (exists) {
    console.info(c.gray(`Already watching document: ${c.white(docid)}`));
  }
  index.change((d) => {
    const list = d.watching || (d.watching = []);
    if (!exists) {
      list.push(Delete.undefined({ docid, addedAt: Time.now.timestamp, name }));
      console.info(c.gray(`Document added: ${c.white(docid)}`));
    } else {
      setWatchingName(d, docid, name);
    }
  });

  await list(index);
}

/**
 * Remove a document from the index.
 */
export async function removeDoc(index: t.CrdtIndexDocRef, repo: t.Crdt.Repo) {
  const ids = await promptDocumentListSelection(index);
  const remove = new Set(ids);

  for (const id of ids) {
    await repo.delete(id);
  }

  index.change((d) => {
    const items = d.watching || (d.watching = []);
    if (!items.length || remove.size === 0) return;
    for (let i = items.length - 1; i >= 0; i--) {
      const id = items[i].docid;
      if (remove.has(id)) items.splice(i, 1);
    }
  });

  const total = remove.size;
  console.info(c.gray(`Removed ${total} ${Str.plural(total, 'document', 'documents')}`));
  await list(index);
}

/**
 * List the documents:
 */
export async function list(index: t.CrdtIndexDocRef) {
  const items = (index.current.watching ?? []).sort((a, b) => a.addedAt - b.addedAt).toReversed();

  if (items.length === 0) {
    return void Fmt.noDocuments();
  }

  console.info(c.gray(`Watching:`));
  console.info(Fmt.itemTable(items));
  console.info();
}
