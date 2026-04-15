import { cookies } from "next/headers";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string | null;
};

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(sessionCookie.value, "base64").toString("utf-8")
    );
    if (!payload.id) return null;
    // Verify user still exists
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return null;
    return { id: user.id, name: user.name, email: user.email, role: user.role, company: user.company };
  } catch {
    return null;
  }
}

export async function login(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role, company: user.company };
}

export function createSessionToken(user: SessionUser): string {
  return Buffer.from(JSON.stringify({ id: user.id })).toString("base64");
}
