import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function formatReadableSize(kb: number): string {
  if (kb >= 1024 * 1024) return `${(kb / (1024 * 1024)).toFixed(2)} GB`;
  if (kb >= 1024) return `${(kb / 1024).toFixed(2)} MB`;
  return `${kb} KB`;
}

// Calculate storage percentage and determine threshold status
function calculateStorageThreshold(storageUsed: number, maxStorageLimit: number) {
  const percentRaw = (storageUsed / maxStorageLimit) * 100;
  const percentInt = Math.min(100, Math.round(percentRaw));
  const is90 = percentInt >= 90 && percentInt < 100;
  const is100 = percentInt >= 100;
  
  return { percentInt, is90, is100, shouldNotify: is90 || is100 };
}

// Create admin notifications for storage threshold
async function createAdminNotifications(
  admins: { id: string }[],
  title: string,
  message: string
): Promise<void> {
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        title,
        message,
        userId: a.id,
      })),
    });
  }
}

// Create user notification for storage threshold
async function createUserNotification(
  userId: string,
  title: string,
  message: string
): Promise<void> {
  await prisma.notification.create({
    data: {
      title,
      message,
      userId,
    },
  });
}

async function processUserStorageThreshold(user: any, admins: any[]) {
  const threshold = calculateStorageThreshold(user.storageUsed, user.maxStorageLimit);
  if (!threshold.shouldNotify) return null;

  const usedReadable = formatReadableSize(user.storageUsed);
  const limitReadable = formatReadableSize(user.maxStorageLimit);
  const notifyTitle = threshold.is100 ? "Storage Full" : "Storage Almost Full";

  // Admin notification
  const adminMessage = `User ${user.email || user.name} has used ${threshold.percentInt}% of their storage (${usedReadable} of ${limitReadable}).`;
  await createAdminNotifications(admins, notifyTitle, adminMessage);

  // User notification
  const userMessage = `You have used ${threshold.percentInt}% of your storage (${usedReadable} of ${limitReadable}).`;
  await createUserNotification(user.id, notifyTitle, userMessage);
  
  return { id: user.id, email: user.email, percent: threshold.percentInt };
}

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-admin-secret");
    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pre-fetch admins for notification fanout
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true },
    });

    // Fetch candidate users with a storage limit set
    const users = await prisma.user.findMany({
      where: { maxStorageLimit: { gt: 0 } },
      select: { id: true, email: true, name: true, storageUsed: true, maxStorageLimit: true },
    });

    const notified: Array<{ id: string; email: string | null; percent: number }> = [];

    for (const user of users) {
      try {
        const result = await processUserStorageThreshold(user, admins);
        if (result) {
          notified.push(result);
        }
      } catch (err) {
        console.error("Cron storage-threshold failed for user:", user.id, err);
      }
    }

    return NextResponse.json({ count: notified.length, notified });
  } catch (error) {
    console.error("Cron storage-threshold route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}


