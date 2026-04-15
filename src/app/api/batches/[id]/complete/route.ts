import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "partner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      candidates: true,
      client: { select: { name: true, company: true, webhookUrl: true } },
    },
  });

  if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const unscored = batch.candidates.filter((c) => !c.score);
  if (unscored.length > 0) {
    return NextResponse.json(
      { error: `${unscored.length} candidates still pending scoring` },
      { status: 400 }
    );
  }

  // Mark batch completed
  const completedAt = new Date();
  await prisma.batch.update({
    where: { id },
    data: {
      status: "completed",
      completedAt,
      processedCount: batch.candidates.length,
    },
  });

  // Fire webhook if URL configured
  const webhookUrl = batch.webhookUrl || batch.client.webhookUrl;
  let webhookResult = null;

  if (webhookUrl) {
    const payload = {
      event: "batch.completed",
      batchRef: batch.batchRef,
      batchId: batch.id,
      source: batch.source,
      completedAt: completedAt.toISOString(),
      totalCandidates: batch.candidates.length,
      summary: {
        clear: batch.candidates.filter((c) => c.score === "CLEAR").length,
        consider: batch.candidates.filter((c) => c.score === "CONSIDER").length,
        adverse: batch.candidates.filter((c) => c.score === "ADVERSE").length,
      },
      results: batch.candidates.map((c) => ({
        candidateId: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        nationalId: c.nationalId,
        positionApplied: c.positionApplied,
        score: c.score,
        scoreNotes: c.scoreNotes,
        scoredAt: c.scoredAt,
      })),
    };

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Nestec-Event": "batch.completed",
          "X-Batch-Ref": batch.batchRef,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      const success = response.ok;
      await prisma.webhookLog.create({
        data: {
          batchId: batch.id,
          url: webhookUrl,
          payload: JSON.stringify(payload),
          statusCode: response.status,
          success,
          error: success ? null : `HTTP ${response.status}`,
        },
      });

      await prisma.batch.update({
        where: { id },
        data: { webhookFired: true, webhookStatus: response.status },
      });

      webhookResult = { success, status: response.status };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      await prisma.webhookLog.create({
        data: {
          batchId: batch.id,
          url: webhookUrl,
          payload: JSON.stringify(payload),
          success: false,
          error: errorMsg,
        },
      });
      webhookResult = { success: false, error: errorMsg };
    }
  }

  return NextResponse.json({ success: true, webhookResult });
}
