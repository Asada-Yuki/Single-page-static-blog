import { readFile } from 'node:fs/promises';
import decode, { init } from '@jsquash/webp/decode.js';
import { webpDimensions } from './webp.js';

const wasm = await readFile(new URL('../node_modules/@jsquash/webp/codec/dec/webp_dec.wasm', import.meta.url));
await init(new WebAssembly.Module(wasm));

export async function validateWebp(bytes) {
  const dimensions = webpDimensions(bytes);
  const decoded = await decode(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  if (decoded.width !== dimensions.width || decoded.height !== dimensions.height) {
    throw new Error('Image dimensions do not match the decoded image.');
  }
  return dimensions;
}

export { decode };
