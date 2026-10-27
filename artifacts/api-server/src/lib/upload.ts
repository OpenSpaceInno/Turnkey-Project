import multer from "multer";
import path from "path";
import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Ensure uploads directory exists for local fallback
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─── Cloudflare R2 / AWS S3 Client Configuration ──────────────────────────────
const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const r2BucketName = process.env.R2_BUCKET_NAME || process.env.AWS_S3_BUCKET || process.env.S3_BUCKET_NAME;
const r2PublicUrl = process.env.R2_PUBLIC_URL || process.env.CDN_BASE_URL;

export const isCloudStorageConfigured = Boolean(r2AccessKeyId && r2SecretAccessKey && r2BucketName);

export const s3Client: S3Client | null = isCloudStorageConfigured
  ? new S3Client({
      region: process.env.AWS_REGION || "auto",
      endpoint: r2AccountId ? `https://${r2AccountId}.r2.cloudflarestorage.com` : process.env.AWS_S3_ENDPOINT,
      credentials: {
        accessKeyId: r2AccessKeyId!,
        secretAccessKey: r2SecretAccessKey!,
      },
    })
  : null;

// Configure multer for local disk storage (with memory storage option for direct streaming)
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique safe filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_\-]/g, "_")
      .slice(0, 60);
    cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
  },
});

export const memoryStorage = multer.memoryStorage();

// Strict whitelist of accepted MIME types and file extensions
const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/svg+xml",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
  "application/json",
  "application/acad",
  "image/vnd.dwg",
  "application/dwg",
]);

const allowedExtensions = new Set([
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg",
  ".txt", ".csv", ".tsv", ".zip", ".json", ".dwg", ".dxf"
]);

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.has(file.mimetype) || allowedExtensions.has(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type rejected. Allowed extensions: ${Array.from(allowedExtensions).join(", ")}`));
  }
};

// Create multer upload instance with strict 25MB limit
export const upload = multer({
  storage: diskStorage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size strictly enforced
  },
});

// Memory upload instance for direct buffer / cloud uploads
export const uploadMemory = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

/**
 * Upload a buffer directly to Cloudflare R2 / S3 if configured, or save locally.
 */
export async function uploadToStorage(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<{ url: string; key: string; isCloud: boolean }> {
  const ext = path.extname(originalFilename).toLowerCase();
  const cleanName = path
    .basename(originalFilename, ext)
    .replace(/[^a-zA-Z0-9_\-]/g, "_")
    .slice(0, 60);
  const uniqueName = `${cleanName}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  if (s3Client && r2BucketName) {
    const key = `uploads/${uniqueName}`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: r2BucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );
    const publicBase = r2PublicUrl || `https://${r2BucketName}.r2.dev`;
    const cleanBase = publicBase.endsWith("/") ? publicBase.slice(0, -1) : publicBase;
    return {
      url: `${cleanBase}/${key}`,
      key,
      isCloud: true,
    };
  }

  // Local filesystem fallback
  const filePath = path.join(uploadsDir, uniqueName);
  await fs.promises.writeFile(filePath, buffer);
  return {
    url: `/uploads/${uniqueName}`,
    key: uniqueName,
    isCloud: false,
  };
}

export { uploadsDir };
