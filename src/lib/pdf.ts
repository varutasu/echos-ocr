import { fromBuffer } from "pdf2pic";
import sharp from "sharp";

export interface PageImage {
  page: number;
  buffer: Buffer;
  width: number;
  height: number;
}

export async function pdfToImages(pdfBuffer: Buffer): Promise<PageImage[]> {
  const converter = fromBuffer(pdfBuffer, {
    density: 200,
    format: "jpeg",
    width: 1600,
    height: 2200,
    quality: 90,
  });

  const pageCount = await getPdfPageCount(pdfBuffer);
  const images: PageImage[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const result = await converter(i, { responseType: "buffer" });
    if (result.buffer) {
      const metadata = await sharp(result.buffer).metadata();
      images.push({
        page: i,
        buffer: result.buffer as Buffer,
        width: metadata.width || 1600,
        height: metadata.height || 2200,
      });
    }
  }

  return images;
}

async function getPdfPageCount(pdfBuffer: Buffer): Promise<number> {
  const text = pdfBuffer.toString("latin1");
  const matches = text.match(/\/Type\s*\/Page(?!s)/g);
  return matches ? matches.length : 2;
}

export async function imageToBase64(buffer: Buffer): Promise<string> {
  const processed = await sharp(buffer)
    .resize(1200, undefined, { withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  return processed.toString("base64");
}

export async function processUploadedImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(1600, undefined, { withoutEnlargement: true })
    .normalize()
    .sharpen()
    .jpeg({ quality: 90 })
    .toBuffer();
}
