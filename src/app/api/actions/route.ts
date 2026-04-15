import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ACTION_TYPE_IDS: Record<string, number> = {
  "Additional fee": 86,
  "Additional Information Received": 149,
  "Additional Information Still Required": 117,
  "Candidate Response": 151,
  "Contact made - Candidate": 154,
  "Extended ETA": 128,
  "Extended ETA due to physical visit required": 159,
  "Information Provided/Received": 99,
  "New ETA": 170,
  "Application submitted": 38,
  "Contact made": 54,
  "Information requirements review": 37,
  "Return to Processor PIS": 1010,
  "Escalation PIS": 1004,
  "Partner - LATEPICKUP": 1995,
  "Free Text": 1020,
};

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { transactionId, componentId, actionType, actionNote, visibility } = await request.json();

    if (!transactionId || !actionType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const action = await prisma.actionHistory.create({
      data: {
        transactionId,
        componentId: componentId || null,
        userId: session.id,
        actionType,
        actionNote: actionNote || null,
        actionTypeId: ACTION_TYPE_IDS[actionType] || null,
        visibility: visibility || "external",
      },
      include: { user: { select: { name: true } } },
    });

    return NextResponse.json({ action }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
