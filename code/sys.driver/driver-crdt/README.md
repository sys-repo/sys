# CRDT contract fixtures

Tests for immutable state, Automerge, Yjs, and Cmd. They distinguish plain values from native
history, and local mutation from worker application and client observation.

This is a private test workspace, not a public CRDT driver.

- [Fixture guide](./src/-test/README.md): execution, native controls, and evidence limits.
- [Mutation-path comparison](./src/-test/-compare/README.md): async owner versus caller-native
  replica.
