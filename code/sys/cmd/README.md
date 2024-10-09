# Cmd (Command)
Distributed function invocation via a Cmd (Command) pattern behind an `Immutable<T>` 
over a CRDT network transport.

### Longer Term (Design Notes)
The CRDT syncing Cmd<T> pattern is a primitive for building up to a
actor model ("message passing computer") implementation.
