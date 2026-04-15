import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "partner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { score, scoreNotes } = await request.json();

  if (!score || !["CLEAR", "CONSIDER", "ADVERSE"].includes(score)) {
    return NextResponse.json({ error: "Invalid score. Must be CLEAR, CONSIDER, or ADVERSE" }, { status: 400 });
  }

  const candidate = await prisma.candidate.update({
    where: { id },
    data: {
      score,
      scoreNotes: scoreNotes || null,
      status: "completed",
      scoredAt: new Date(),
      scoredById: session.id,
    },
  });

  // Update batch processedCount
  const processed = await prisma.candidate.count({
    where: { batchId: candidate.batchId, score: { not: null } },
  });
  const total = await prisma.candidate.count({ where: { batchId: candidate.batchId } });

  await prisma.batch.update({
    where: { id: candidate.batchId },
    data: {
      processedCount: processed,
      status: processed === total ? "completed" : "processing",
    },
  });

  return NextResponse.json({ candidate });
}
