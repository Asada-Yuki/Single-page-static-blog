// Read dimensions before decoding, so a small file cannot allocate an enormous bitmap.
export function webpDimensions(input, maxPixels = 16_777_216) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (offset) => String.fromCharCode(...bytes.subarray(offset, offset + 4));
  const invalid = () => { throw new Error('The WebP image is damaged or unsupported.'); };
  if (bytes.length < 20 || tag(0) !== 'RIFF' || tag(8) !== 'WEBP'
    || view.getUint32(4, true) + 8 !== bytes.length) invalid();
  let dimensions;
  let canvas;
  let frames = 0;
  for (let offset = 12; offset < bytes.length;) {
    if (offset + 8 > bytes.length) invalid();
    const type = tag(offset);
    const length = view.getUint32(offset + 4, true);
    const start = offset + 8;
    const end = start + length;
    const next = end + (length % 2);
    if (end > bytes.length || next > bytes.length) invalid();
    if (type === 'ANIM' || type === 'ANMF') invalid();
    if (type === 'VP8X') {
      if (length !== 10 || canvas || (bytes[start] & 2)) invalid();
      const read24 = (i) => bytes[i] | (bytes[i + 1] << 8) | (bytes[i + 2] << 16);
      canvas = { width: read24(start + 4) + 1, height: read24(start + 7) + 1 };
    }
    if (type === 'VP8 ') {
      if (length < 10 || bytes[start] & 1 || bytes[start + 3] !== 0x9d
        || bytes[start + 4] !== 1 || bytes[start + 5] !== 0x2a) invalid();
      dimensions = { width: view.getUint16(start + 6, true) & 0x3fff,
        height: view.getUint16(start + 8, true) & 0x3fff };
      frames += 1;
    }
    if (type === 'VP8L') {
      if (length < 5 || bytes[start] !== 0x2f) invalid();
      const bits = view.getUint32(start + 1, true);
      if (bits >>> 29) invalid();
      dimensions = { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
      frames += 1;
    }
    offset = next;
  }
  if (frames !== 1 || !dimensions?.width || !dimensions.height) invalid();
  if (canvas && (canvas.width !== dimensions.width || canvas.height !== dimensions.height)) invalid();
  if (dimensions.width * dimensions.height > maxPixels) throw new Error('The image has too many pixels.');
  return dimensions;
}
