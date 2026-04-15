import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const transactionId = formData.get("transactionId") as string;
    const componentId = formData.get("componentId") as string | null;
    const name = formData.get("name") as string;

    if (!file || !transactionId || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Only PDF and image files are allowed" }, { status: 400 });
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    // Ensure upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Save file
    const ext = file.name.split(".").pop() || "pdf";
    const filename = `${transactionId}_${Date.now()}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    const bytes = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(bytes));

    const doc = await prisma.document.create({
      data: {
        transactionId,
        componentId: componentId || null,
        uploadedById: session.id,
        name,
        fileType: file.type === "application/pdf" ? "PDF" : "Image",
        fileSize: file.size,
        filePath: filename,
      },
      include: { uploadedBy: { select: { name: true } } },
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
