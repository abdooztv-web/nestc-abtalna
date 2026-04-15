import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "csv");

function generateBatchRef(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BST-${year}-${rand}`;
}

// Parse CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += line[i];
    }
  }
  result.push(current.trim());
  return result;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const source = searchParams.get("source") || "";

  const where: Record<string, unknown> = {};
  if (session.role === "partner") where.clientId = session.id;
  if (status) where.status = status;
  if (source) where.source = source;

  const batches = await prisma.batch.findMany({
    where,
    include: {
      client: { select: { name: true, company: true } },
      assignedTo: { select: { name: true } },
      _count: { select: { candidates: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ batches });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const source = (formData.get("source") as string) || "direct";
    const priority = (formData.get("priority") as string) || "standard";
    const notes = (formData.get("notes") as string) || "";
    const webhookUrl = (formData.get("webhookUrl") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "Only CSV files are accepted" }, { status: 400 });
    }

    // Read and parse CSV
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV must have a header row and at least one candidate" }, { status: 400 });
    }

    // Expected headers (case-insensitive)
    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
    const candidates: {
      firstName: string; lastName: string; middleName?: string;
      dateOfBirth?: string; nationalId?: string; phone?: string;
      address?: string; positionApplied?: string;
    }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ""; });

      const firstName = row["first_name"] || row["firstname"] || row["first"] || "";
      const lastName = row["last_name"] || row["lastname"] || row["last"] || "";
      if (!firstName && !lastName) continue;

      candidates.push({
        firstName,
        lastName,
        middleName: row["middle_name"] || row["middlename"] || undefined,
        dateOfBirth: row["date_of_birth"] || row["dob"] || row["birth_date"] || undefined,
        nationalId: row["national_id"] || row["national_id_number"] || row["id"] || undefined,
        phone: row["phone"] || row["phone_number"] || row["mobile"] || undefined,
        address: row["address"] || undefined,
        positionApplied: row["position"] || row["position_applied_for"] || row["position_applied"] || undefined,
      });
    }

    if (candidates.length === 0) {
      return NextResponse.json({ error: "No valid candidates found in CSV" }, { status: 400 });
    }

    // Save CSV file
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const csvFilename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    await fs.writeFile(path.join(UPLOAD_DIR, csvFilename), text, "utf-8");

    // Create batch + candidates
    const batchRef = generateBatchRef();
    const batch = await prisma.batch.create({
      data: {
        batchRef,
        clientId: session.id,
        status: "pending",
        source,
        priority,
        notes: notes || null,
        csvFilename,
        webhookUrl: webhookUrl || session.webhookUrl || null,
        totalCount: candidates.length,
        candidates: {
          create: candidates.map((c) => ({ ...c, status: "pending" })),
        },
      },
      include: { candidates: true, _count: { select: { candidates: true } } },
    });

    return NextResponse.json({ batch }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
