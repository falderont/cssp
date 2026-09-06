import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Local-disk file storage for the MVP — good enough for a single-instance
 * deploy or a demo; a production build would swap this for S3/GCS behind the
 * same two functions. This is the Download Center's document files and Remote
 * Hands' completion photos: the first binary-upload requirements in the
 * system, per docs/prd-v4.md Section 9.
 */
const STORAGE_ROOT = path.join(process.cwd(), "storage");

function assertInsideStorageRoot(resolved: string) {
  const root = path.resolve(STORAGE_ROOT) + path.sep;
  if (!resolved.startsWith(root)) {
    throw new Error("Invalid file reference.");
  }
}

export async function saveUploadedFile(
  file: File,
  subdir: string,
): Promise<{ fileRef: string; fileName: string; fileSize: number }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const dir = path.join(STORAGE_ROOT, subdir);
  await mkdir(dir, { recursive: true });
  const safeName = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const fileRef = path.posix.join(subdir, safeName);
  const resolved = path.resolve(STORAGE_ROOT, fileRef);
  assertInsideStorageRoot(resolved);
  await writeFile(resolved, buffer);
  return { fileRef, fileName: file.name, fileSize: buffer.length };
}

export async function readStoredFile(fileRef: string): Promise<Buffer> {
  const resolved = path.resolve(STORAGE_ROOT, fileRef);
  assertInsideStorageRoot(resolved);
  return readFile(resolved);
}
