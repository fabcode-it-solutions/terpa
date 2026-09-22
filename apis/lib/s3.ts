import { env } from "@/lib/env";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// S3 client setup for DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: `https://${env.SPACES_REGION}.digitaloceanspaces.com`,
  region: env.SPACES_REGION,
  credentials: {
    accessKeyId: env.SPACES_KEY,
    secretAccessKey: env.SPACES_SECRET,
  },
  forcePathStyle: false,
});

export interface UploadResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

/**
 * Upload a file to S3 with private ACL (existing functionality)
 */
export async function uploadFilePrivate(
  file: File,
  key: string,
): Promise<UploadResult> {
  const buffer = Buffer.from(await file.arrayBuffer());

  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.SPACES_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ACL: "private",
    }),
  );

  return {
    fileUrl: key,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  };
}

/**
 * Upload a file to S3 with public-read ACL for public access
 */
export async function uploadFilePublic(
  file: File,
  key: string,
): Promise<UploadResult> {
  const buffer = Buffer.from(await file.arrayBuffer());

  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.SPACES_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ACL: "public-read",
    }),
  );

  return {
    fileUrl: key,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  };
}

/**
 * Generate a CDN URL from an S3 key for public files
 */
export function getCdnUrl(key: string): string {
  return `https://${env.SPACES_BUCKET}.${env.SPACES_REGION}.cdn.digitaloceanspaces.com/${key}`;
}

/**
 * Generate a presigned URL for private file access
 */
export async function generatePresignedUrl(
  key: string,
  expiresIn: number = 300, // 5 minutes default
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.SPACES_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a unique file key for uploads
 */
export function generateFileKey(
  prefix: string,
  originalFileName: string,
): string {
  const fileExtension = originalFileName.split(".").pop();
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 15);

  return `${prefix}/${timestamp}-${randomSuffix}.${fileExtension}`;
}

// Export the S3 client for advanced use cases
export { s3Client };
