export type GbrTip = {
  name: string;
  colorMode: "mask" | "rgba";
  width: number;
  height: number;
  spacingPercent: number;
  /** RGBA-пиксели; у серого GBR чёрный непрозрачен, белый прозрачен. */
  pixels: Uint8ClampedArray;
};

const MAX_SIDE = 2048;
const MAX_PIXELS = 2048 * 2048;
const HEADER_SIZE = 28;
const GIMP_MAGIC = 0x47494d50;

/** Читает документированный GBR v2 без выполнения содержимого файла. */
export function parseGbr(input: ArrayBuffer | Uint8Array): GbrTip {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.byteLength < HEADER_SIZE) throw new Error("GBR header is truncated");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const headerSize = view.getUint32(0, false);
  const version = view.getUint32(4, false);
  const width = view.getUint32(8, false);
  const height = view.getUint32(12, false);
  const channels = view.getUint32(16, false);
  const magic = view.getUint32(20, false);
  const spacingPercent = view.getUint32(24, false);

  if (version !== 2 || magic !== GIMP_MAGIC) throw new Error("Only GIMP GBR v2 is supported");
  if (headerSize < HEADER_SIZE || headerSize > bytes.byteLength || headerSize > 4096) {
    throw new Error("Invalid GBR header size");
  }
  if (!width || !height || width > MAX_SIDE || height > MAX_SIDE || width * height > MAX_PIXELS) {
    throw new Error("GBR dimensions exceed the safety limit");
  }
  if (channels !== 1 && channels !== 4) throw new Error("Unsupported GBR channel count");
  if (!spacingPercent || spacingPercent > 1000) throw new Error("Invalid GBR spacing");
  const bodySize = width * height * channels;
  if (bytes.byteLength - headerSize !== bodySize) throw new Error("Invalid GBR pixel data length");
  const nameBytes = bytes.subarray(HEADER_SIZE, headerSize);
  const nameEnd = nameBytes.indexOf(0);
  const name = new TextDecoder("utf-8", { fatal: true }).decode(
    nameEnd < 0 ? nameBytes : nameBytes.subarray(0, nameEnd)
  );
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const source = headerSize + i * channels;
    const target = i * 4;
    if (channels === 1) {
      pixels[target] = pixels[target + 1] = pixels[target + 2] = 255;
      pixels[target + 3] = 255 - bytes[source];
    } else {
      pixels[target] = bytes[source];
      pixels[target + 1] = bytes[source + 1];
      pixels[target + 2] = bytes[source + 2];
      pixels[target + 3] = bytes[source + 3];
    }
  }
  return { name, colorMode: channels === 1 ? "mask" : "rgba", width, height, spacingPercent, pixels };
}
