import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function getAuthenticatedUserId(): Promise<string> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.userId || !session?.user?.is2FAVerified) {
    throw new Error("401");
  }

  return session.user.userId;
}
