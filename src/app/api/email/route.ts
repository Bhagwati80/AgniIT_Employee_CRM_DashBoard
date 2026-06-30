import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { to, subject, text } = await req.json();

    await sendEmail({
      to,
      subject,
      text,
    });

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to send email",
      },
      { status: 500 }
    );
  }
}