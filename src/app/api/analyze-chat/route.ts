import { NextResponse } from 'next/server';

// API này đã bị loại bỏ (AI Gemini đã gỡ khỏi hệ thống)
export async function POST() {
  return NextResponse.json({ error: 'Chức năng AI đã bị gỡ khỏi hệ thống.' }, { status: 410 });
}
