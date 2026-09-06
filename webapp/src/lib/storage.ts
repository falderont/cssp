import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Local-disk file storage for the demo. Swap this module out for S3/GCS-backed
// storage in production — nothing else in the app depends on the file layout.
const STORAGE_ROOT = path.join(process.cwd(), "storage");

export async function saveUploadedFile(file: File, subdir: string) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${subdir}/${randomUUID()}-${safeName}`;
  const fullPath = path.join(STORAGE_ROOT, key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
  return {
    storageKey: key,
    fileName: file.name || safeName,
    mimeType: file.type || "application/octet-stream",
    fileSizeKb: Math.max(1, Math.round(buffer.byteLength / 1024)),
  };
}

export async function readStoredFile(key: string): Promise<Buffer> {
  return readFile(path.join(STORAGE_ROOT, key));
}

// Branding assets (the provider's logo) are served directly by Next's static
// file handler, unlike everything else in this module, because they need to
// render on the public login screen before anyone is authenticated.
const PUBLIC_ROOT = path.join(process.cwd(), "public");

export async function savePublicAsset(file: File, subdir: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".png";
  const fileName = `${subdir}-${randomUUID()}${ext}`;
  const fullPath = path.join(PUBLIC_ROOT, subdir, fileName);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
  return `/${subdir}/${fileName}`;
}
