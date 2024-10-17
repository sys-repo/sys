# Command Pattern
Distributed function invocation via a `Cmd<T>` structure that transmits/syncs over a CRDT transport.

The strategy leans on the observable/event-stream properties of the `Immutable<T>` interface coupled with a CRDT's capabilities around reliably and resiliently syncing over a network.



### Longer Term (Design Notes)
The CRDT/syncing `Cmd<T>` pattern is a primitive for building up to an [actor model](https://youtu.be/vMDHpPN_p08?si=yzdKxO-UjdDEoqso) ("[message passing computer](https://www.youtube.com/live/nOrdzDaPYV4?si=k8yEQpA9LMpRFLSy&t=1388)") implementation.
