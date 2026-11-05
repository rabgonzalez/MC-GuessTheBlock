/**
 * Minimal PNG decoder for Minecraft textures: 8-bit greyscale, RGB, RGBA,
 * grey+alpha and palette images (1/2/4/8-bit), not interlaced.
 */
import { inflateSync } from "node:zlib";

/** @returns {{ width: number, height: number, rgba: Uint8Array }} */
export function decodePng(buf) {
  let i = 8;
  let width = 0;
  let height = 0;
  let depth = 8;
  let type = 6;
  let palette = null;
  let alpha = null;
  const idat = [];
  while (i < buf.length) {
    const len = buf.readUInt32BE(i);
    const name = buf.toString("ascii", i + 4, i + 8);
    const data = buf.subarray(i + 8, i + 8 + len);
    if (name === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8];
      type = data[9];
      if (data[12]) throw new Error("Interlaced PNG");
    } else if (name === "PLTE") palette = data;
    else if (name === "tRNS") alpha = data;
    else if (name === "IDAT") idat.push(data);
    i += 12 + len;
  }
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  const bpp = Math.max(1, (channels * depth) / 8);
  const stride = Math.ceil((width * channels * depth) / 8);
  const raw = inflateSync(Buffer.concat(idat));
  const px = new Uint8Array(stride * height);

  // Undo the per-row filters.
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const out = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[out + x - bpp] : 0;
      const b = y > 0 ? px[out + x - stride] : 0;
      const c = x >= bpp && y > 0 ? px[out + x - stride - bpp] : 0;
      let v = raw[src + x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      px[out + x] = v & 0xff;
    }
  }

  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      if (type === 3) {
        const bit = x * depth;
        const byte = px[y * stride + (bit >> 3)];
        const idx = (byte >> (8 - depth - (bit & 7))) & ((1 << depth) - 1);
        rgba.set(palette.subarray(idx * 3, idx * 3 + 3), o);
        rgba[o + 3] = alpha && idx < alpha.length ? alpha[idx] : 255;
        continue;
      }
      const s = y * stride + x * channels;
      if (type === 0 || type === 4) {
        rgba.fill(px[s], o, o + 3);
        rgba[o + 3] = type === 4 ? px[s + 1] : 255;
      } else {
        rgba.set(px.subarray(s, s + 3), o);
        rgba[o + 3] = type === 6 ? px[s + 3] : 255;
      }
    }
  }
  return { width, height, rgba };
}
