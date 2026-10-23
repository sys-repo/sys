// Test-only negative control: resolve a legacy-owned module without its public API closure.
// The deliberate internal import tests ownership rejection, not legacy driver initialization.
import '../../../../driver-automerge/src/pkg.ts';
