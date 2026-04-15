import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, company: true, source: true } },
      assignedTo: { select: { id: true, name: true } },
      candidates: {
        include: { scoredBy: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role === "partner" && batch.clientId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ batch });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const batch = await prisma.batch.update({
    where: { id },
    data: body,
  });

  return NextResponse.json({ batch });
}
