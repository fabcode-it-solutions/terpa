import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const s3Client = new S3Client({
  endpoint: `https://${env.SPACES_REGION}.digitaloceanspaces.com`,
  region: env.SPACES_REGION,
  credentials: {
    accessKeyId: env.SPACES_KEY,
    secretAccessKey: env.SPACES_SECRET,
  },
  forcePathStyle: false,
});

type RouteContext = {
  params: {
    slug: string;
    invoiceId: string;
  };
};

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = requireSession();

  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: params.invoiceId,
        team: {
          slug: params.slug,
        },
      },
      select: {
        paymentProofUrl: true,
        team: {
          select: {
            members: {
              where: {
                userId: session.uid,
              },
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Authorization check: user must be part of the team or an admin
    const isUserInTeam = invoice.team.members.length > 0;
    if (session.role !== UserRole.ADMIN && !isUserInTeam) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (!invoice.paymentProofUrl) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Extract extension from paymentProofUrl
    const s3Key = invoice.paymentProofUrl;
    // Get the filename part from the S3 key (e.g., "document.pdf" from "path/to/document.pdf")
    const filenameFromKey = s3Key.substring(s3Key.lastIndexOf("/") + 1);
    // Split the filename by dot to find the extension
    const filenameParts = filenameFromKey.split(".");
    // Use the last part as extension, or 'bin' if no extension found (e.g. filename is "myfile")
    const extension =
      filenameParts.length > 1
        ? filenameParts[filenameParts.length - 1]
        : "bin";

    const { Body, ContentType } = await s3Client.send(
      new GetObjectCommand({
        Bucket: env.SPACES_BUCKET,
        Key: invoice.paymentProofUrl,
      }),
    );

    if (!Body) {
      return new NextResponse("File not found in storage", { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", ContentType ?? "application/octet-stream");

    // Browser-supported formats for inline display
    const inlineFormats = ["pdf", "jpg", "jpeg", "png"];
    const disposition = inlineFormats.includes(extension.toLowerCase())
      ? "inline"
      : "attachment";

    headers.set(
      "Content-Disposition",
      `${disposition}; filename="comprobante-${params.invoiceId}.${extension}"`,
    );

    // @ts-ignore
    return new NextResponse(Body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Failed to download payment proof:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
