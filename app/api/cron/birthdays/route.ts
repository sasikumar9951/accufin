import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET/POST: find all users whose birthday is today (month/day) and send email
export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-admin-secret");
    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const now = new Date();
    const month = now.getUTCMonth() + 1; // 1-12
    const day = now.getUTCDate(); // 1-31

    // Find users with dateOfBirth matching today's month and day (ignore year)
    const users = await prisma.user.findMany({
      where: {
        dateOfBirth: { not: null },
        sendBirthdayEmail: true, // Only get users who want birthday emails
      },
      select: {
        id: true,
        name: true,
        email: true,
        dateOfBirth: true,
        sendBirthdayEmail: true,
      },
    });

    const birthdayUsers = users.filter((u) => {
      if (!u.dateOfBirth) return false;
      const dob = new Date(u.dateOfBirth);
      return dob.getUTCMonth() + 1 === month && dob.getUTCDate() === day;
    });

    const results = [] as Array<{
      id: string;
      email: string;
      success: boolean;
    }>;

    for (const user of birthdayUsers) {
      if (!user.email) continue;
      results.push({ id: user.id, email: user.email, success: false }); // Email sending removed
    }

    return NextResponse.json({
      count: birthdayUsers.length,
      results,
    });
  } catch (error) {
    console.error("Birthday cron route error:", error);
    return NextResponse.json(
      { error: "Failed to process birthdays" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Allow manual trigger via GET for convenience
  return POST(req);
}
