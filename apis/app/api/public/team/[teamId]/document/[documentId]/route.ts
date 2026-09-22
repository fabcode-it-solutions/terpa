import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

// S3 client setup
const s3Client = new S3Client({
  endpoint: `https://${env.SPACES_REGION}.digitaloceanspaces.com`,
  region: env.SPACES_REGION,
  credentials: {
    accessKeyId: env.SPACES_KEY,
    secretAccessKey: env.SPACES_SECRET,
  },
  forcePathStyle: false,
});

// File types that can be displayed inline in browser
const inlineTypes = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "text/plain",
];

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string; documentId: string } },
) {
  try {
    const { teamId, documentId } = params;

    if (!teamId || !documentId) {
      return NextResponse.json(
        { error: "Team ID and Document ID are required" },
        { status: 400 },
      );
    }

    // Find the document and verify it belongs to the specified team
    const document = await prisma.teamDocument.findUnique({
      where: {
        id: documentId,
        teamId: teamId,
        deletedAt: null, // Only serve non-deleted documents
      },
      select: {
        fileUrl: true,
        fileName: true,
        fileType: true,
        fileSize: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found or access denied" },
        { status: 404 },
      );
    }

    // Fetch the file from S3
    const command = new GetObjectCommand({
      Bucket: env.SPACES_BUCKET,
      Key: document.fileUrl,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return NextResponse.json(
        { error: "File content not found" },
        { status: 404 },
      );
    }

    // Determine content disposition based on file type
    const isInlineType = inlineTypes.includes(document.fileType.toLowerCase());
    const disposition = isInlineType
      ? "inline"
      : `attachment; filename="${document.fileName}"`;

    // Convert the stream to a web-compatible stream
    const stream = response.Body.transformToWebStream();

    // Return the file with appropriate headers
    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": document.fileType,
        "Content-Disposition": disposition,
        "Content-Length": document.fileSize.toString(),
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      },
    });
  } catch (error) {
    console.error("[PUBLIC API] Error streaming document:", error);

    return NextResponse.json(
      {
        error: "Failed to stream document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
