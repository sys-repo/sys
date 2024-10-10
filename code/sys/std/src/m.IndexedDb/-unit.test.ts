import 'fake-indexeddb/auto';
import { Time, describe, expect, it } from '../-test.ts';
import { IndexedDb } from './mod.ts';

describe('IndexedDb', () => {
  const name = 'dev.test';
  type T = { name: string; db: IDBDatabase };

  const assertDbExists = async (name: string, exists = true) => {
    const databases = await indexedDB.databases();
    const match = databases.find((db) => db.name === name);
    expect(Boolean(match)).to.eql(exists);
  };

  describe('create', () => {
    it('create', async () => {
      await Time.wait(100);
      const res = await IndexedDb.init<T>({ name, store: (db) => ({ name, db }) });
      expect(res.name).to.eql(name);
      expect(res.db instanceof IDBDatabase).to.eql(true);
      await assertDbExists(name, true);
      res.db.close();
    });
    it('create (already exists)', async () => {
      await Time.wait(100);
      const res1 = await IndexedDb.init<T>({ name, store: (db) => ({ name, db }) });
      const res2 = await IndexedDb.init<T>({ name, store: (db) => ({ name, db }) });
      expect(res1.db.name).to.eql(res2.name);

      res1.db.close();
      res2.db.close();
    });
  });

  describe('delete', () => {
    it('delete non-existant database (no error)', async () => {
      const res = await IndexedDb.delete('404-no-exist');
      expect(res.error).to.eql(undefined);
    });

    it('delete', async () => {
      await assertDbExists(name, true);
      const res = await IndexedDb.delete(name);
      expect(res.name).to.eql('dev.test');
      expect(res.error).to.eql(undefined);

      await Time.wait(500);
      await assertDbExists(name, false);
      expect(res.error).to.eql(undefined);
      expect(res.name).to.eql(name);
    });

    it('delete (already deleted)', async () => {
      const res = await IndexedDb.delete(name);
      expect(res.name).to.eql('dev.test');
      expect(res.error).to.eql(undefined);
      await assertDbExists(name, false);
    });
  });

  describe('IndexedDb.Database', () => {
    it('isClosed', async () => {
      const res = await IndexedDb.init<T>({ name, store: (db) => ({ name, db }) });
      expect(IndexedDb.Database.isClosed(res.db)).to.eql(false);

      res.db.close();
      expect(IndexedDb.Database.isClosed(res.db)).to.eql(true);
    });
  });
});
