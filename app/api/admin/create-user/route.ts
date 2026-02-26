import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { requireAdminSession, error } from "@/lib/api-helpers";
// import { sendUserCreatedEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized. Admin access required.", 401);

    const {
      email,
      password,
      name,
      sinNumber,
      businessNumber,
      dateOfBirth,
      contactNumber,
      isAdmin: isAdminIncoming,
      maxStorageLimit: maxStorageLimitIncoming,
    } = await req.json();

    if (!email || !password) return error("Email and password are required.", 400);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return error("User already exists.", 409);

    const hashedPassword = await hash(password, 10);

    // Parse dateOfBirth if provided
    let parsedDateOfBirth = null;
    if (dateOfBirth) {
      parsedDateOfBirth = new Date(dateOfBirth);
      if (Number.isNaN(parsedDateOfBirth.getTime())) {
        return error("Invalid date of birth format.", 400);
      }
    }

    const isAdmin = Boolean(isAdminIncoming);
    const maxStorageLimit = typeof maxStorageLimitIncoming === "number" && maxStorageLimitIncoming > 0
      ? Math.floor(maxStorageLimitIncoming)
      : undefined;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        isAdmin: isAdmin,
        name,
        sinNumber,
        businessNumber,
        dateOfBirth: parsedDateOfBirth,
        contactNumber,
        ...(maxStorageLimit ? { maxStorageLimit } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        sinNumber: true,
        businessNumber: true,
        dateOfBirth: true,
        isAdmin: true,
        createdAt: true,
        contactNumber: true,
      },
    });

      // Email sending removed

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error("Error creating user:", err);
    return error("Server error.", 500);
  }
}
