import decode, { init } from '@jsquash/webp/decode.js';
import wasm from '../../node_modules/@jsquash/webp/codec/dec/webp_dec.wasm';
import worker from './index.js';

init(wasm);
import { SessionStore as SessionLedger } from './index.js';
export class SessionStore extends SessionLedger {
  constructor(state, env) { super(state, { ...env, WEBP_DECODER: decode }); }
}
export default {
  fetch(request, env, ctx) {
    return worker.fetch(request, { ...env, WEBP_DECODER: decode }, ctx);
  }
};
