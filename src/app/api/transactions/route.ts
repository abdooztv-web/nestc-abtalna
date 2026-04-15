import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTransId } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const tab = searchParams.get("tab") || "all";

  const where: Record<string, unknown> = {};

  if (session.role === "partner") {
    where.createdById = session.id;
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { transId: { contains: search } },
    ];
  }

  if (status) where.status = status;

  if (tab === "late") {
    where.status = "pending_review";
  } else if (tab === "additional_info") {
    where.status = "additional_info";
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      createdBy: { select: { name: true, company: true } },
      assignedTo: { select: { name: true } },
      components: true,
      _count: { select: { documents: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ transactions });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const {
      subjectType, inquiryType, firstName, lastName, middleName, maidenName,
      birthDate, gender, title, country, addressLine1, addressLine2,
      residencyStart, residencyEnd, clientId, otherNames,
    } = body;

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "First name and last name required" }, { status: 400 });
    }

    const transId = generateTransId();

    const transaction = await prisma.transaction.create({
      data: {
        transId,
        subjectType: subjectType || "individual",
        inquiryType: inquiryType || "employment_screening",
        firstName,
        lastName,
        middleName,
        maidenName,
        otherNames,
        birthDate,
        gender,
        title,
        country: country || "Egypt",
        addressLine1,
        addressLine2,
        residencyStart,
        residencyEnd,
        clientId,
        createdById: session.id,
        status: "submitted",
        components: {
          create: {
            type: "criminal_history_egypt",
            status: "in_progress",
            allocationStatus: "ICVendorNEI",
          },
        },
      },
      include: { components: true },
    });

    // Add initial action history
    await prisma.actionHistory.create({
      data: {
        transactionId: transaction.id,
        componentId: transaction.components[0]?.id,
        userId: session.id,
        actionType: "Application submitted",
        actionNote: "The application is submitted and the TAT is 8 business days",
        actionTypeId: 38,
        visibility: "external",
      },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
