/**
 * @module
 * Installs missing `Symbol.dispose` and `Symbol.asyncDispose` properties.
 *
 * Import this module for its side effect before evaluating disposable resources. Existing protocol
 * symbols remain authoritative. Import throws when either property is incompatible or installation
 * is required on a non-extensible `Symbol` constructor.
 *
 * This establishes protocol keys only; it does not polyfill Explicit Resource Management.
 */

import { installDisposalProtocolSymbols } from '../u.protocolSymbols.ts';

installDisposalProtocolSymbols();
