import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const contactSchema = z.object({
      name: z.string().trim().min(1, "Name is required"),
      email: z.string().trim().email("Invalid email format"),
      subject: z.string().trim().min(1, "Subject is required"),
      message: z.string().trim().min(1, "Message is required"),
    });

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }





    return NextResponse.json(
      { message: "Message sent successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
