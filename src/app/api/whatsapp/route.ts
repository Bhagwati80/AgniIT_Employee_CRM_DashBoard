import { NextResponse } from "next/server";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(req: Request) {
  try {
    const { to, message } = await req.json();

    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER!,
      to: `whatsapp:${to}`,
      body: message,
    });

    return NextResponse.json({
      success: true,
      message: "WhatsApp sent successfully",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to send WhatsApp",
      },
      { status: 500 }
    );
  }
}