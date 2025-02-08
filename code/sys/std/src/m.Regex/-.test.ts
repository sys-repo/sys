import { describe, expect, it } from '../-test.ts';
import { Regex } from './mod.ts';

describe('Regex', () => {
  describe('escape', () => {
    it('should not alter a string with no special regex characters', () => {
      const input = 'react';
      const escaped = Regex.escape(input);
      expect(escaped).to.eql('react');

      // Create a regex that matches the literal string "react".
      const regex = new RegExp(`^${escaped}$`);
      expect(regex.test('react')).to.eql(true);
      expect(regex.test('React')).to.eql(false); // NB: Case-sensitive check.
    });

    it('should escape special regex characters correctly', () => {
      const input = 'react+module*test?';
      const escaped = Regex.escape(input);
      const expected = 'react\\+module\\*test\\?';
      expect(escaped).to.eql(expected);

      // Using the escaped string to create a regex that matches the literal input
      const regex = new RegExp(`^${escaped}$`);
      expect(regex.test('react+module*test?')).to.eql(true);
      expect(regex.test('reactXmodule*test?')).to.eql(false);
    });

    it('should escape multiple occurrences of special characters', () => {
      // This string includes many special regex characters.
      const input = '.*+?^${}()|[]\\';
      const escaped = Regex.escape(input);

      // Create a regex that should match the literal input string exactly.
      const regex = new RegExp(`^${escaped}$`);
      expect(regex.test('.*+?^${}()|[]\\')).to.eql(true);

      // A slightly different string should not match.
      expect(regex.test('.*+?^${}()|[]')).to.eql(false);
    });
  });
});
