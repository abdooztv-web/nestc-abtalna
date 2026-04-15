import { NextResponse } from "next/server";

export async function GET() {
  const csv = [
    "First Name,Last Name,Middle Name,Date of Birth,National ID,Phone,Address,Position Applied For",
    "Mohamed,Elsayed,Essam,1990-05-04,12345678901234,+201234567890,\"15 Ezz El-Din St - Cairo\",Driver",
    "Ahmed,Hassan,,1985-11-20,98765432101234,+201098765432,\"22 Tahrir Sq - Giza\",Security Guard",
  ].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="nestec_batch_template.csv"`,
    },
  });
}
