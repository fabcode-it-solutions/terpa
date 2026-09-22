import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { UserRole } from "@prisma/client";
import { notFound } from "next/navigation";

const s3Client = new S3Client({
  endpoint: `https://${env.SPACES_REGION}.digitaloceanspaces.com`,
  region: env.SPACES_REGION,
  credentials: {
    accessKeyId: env.SPACES_KEY,
    secretAccessKey: env.SPACES_SECRET,
  },
  forcePathStyle: false,
});

export async function GET(
  request: Request,
  { params }: { params: { slug: string; documentId: string } },
) {
  const session = requireSession();

  // Only admins can download team documents
  if (session.role !== UserRole.ADMIN) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get the document and verify it exists (excluding soft-deleted documents)
  const document = await prisma.teamDocument.findUnique({
    where: {
      id: params.documentId,
      team: {
        slug: params.slug,
      },
      deletedAt: null, // Filter out soft-deleted documents
    },
    select: {
      fileUrl: true,
      fileName: true,
    },
  });

  if (!document) {
    return notFound();
  }

  // Generate a presigned URL that expires in 5 minutes
  const command = new GetObjectCommand({
    Bucket: env.SPACES_BUCKET,
    Key: document.fileUrl,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  return Response.json({ url, fileName: document.fileName });
}
