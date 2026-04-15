import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, company: true } },
      assignedTo: { select: { id: true, name: true } },
      components: true,
      actionHistory: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      documents: {
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!transaction) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Partners can only see their own transactions
  if (session.role === "partner" && transaction.createdById !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ transaction });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const transaction = await prisma.transaction.update({
    where: { id },
    data: body,
  });

  return NextResponse.json({ transaction });
}
