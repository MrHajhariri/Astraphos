import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

type StoredAsset = {
  url: string;
  storageProvider: string;
  storageKey: string;
};

const allowedMimeTypes = new Set(["image/gif", "image/jpeg", "image/png", "image/webp"]);

export function validateUpload(file: File) {
  const maxBytes = Number(process.env.UPLOAD_MAX_BYTES ?? 5 * 1024 * 1024);
  if (file.size > maxBytes) return `Files must be ${Math.floor(maxBytes / 1024 / 1024)} MB or smaller.`;
  if (!allowedMimeTypes.has(file.type)) return "Only GIF, JPEG, PNG, and WebP images are supported.";
  return null;
}

export async function storeUpload(file: File): Promise<StoredAsset> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storageKey = `${crypto.randomUUID()}-${safeName}`;
  const body = Buffer.from(await file.arrayBuffer());

  if (process.env.STORAGE_PROVIDER === "s3") {
    return storeS3Upload(file, storageKey, body);
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, storageKey), body);

  return { url: `/uploads/${storageKey}`, storageProvider: "local", storageKey };
}

async function storeS3Upload(file: File, storageKey: string, body: Buffer): Promise<StoredAsset> {
  const bucket = process.env.S3_BUCKET;
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? "auto";
  const publicUrl = process.env.S3_PUBLIC_URL;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!bucket || !accessKeyId || !secretAccessKey) throw new Error("S3 storage is not configured.");

  const client = new S3Client({
    region,
    endpoint,
    forcePathStyle: Boolean(endpoint),
    credentials: { accessKeyId, secretAccessKey },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      Body: body,
      ContentType: file.type || "application/octet-stream",
    }),
  );

  const urlBase = publicUrl || (endpoint ? `${endpoint.replace(/\/$/, "")}/${bucket}` : `https://${bucket}.s3.${region}.amazonaws.com`);
  return { url: `${urlBase.replace(/\/$/, "")}/${storageKey}`, storageProvider: "s3", storageKey };
}
