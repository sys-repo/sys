# Cmd (Command)
Distributed function invocation via a `Cmd<T>` (command) pattern over a CRDT transport.

The strategy leans on the observable/event-stream properties of the `Immutable<T>`
interface coupled with the CRDT's capabilities to reliably sync itself over
a network connection.



### Longer Term (Design Notes)
The CRDT syncing Cmd<T> pattern is a primitive for building up to a
actor model ("message passing computer") implementation.
