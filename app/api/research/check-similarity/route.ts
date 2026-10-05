import { NextRequest, NextResponse } from 'next/server';
import { checkTopicSimilarity } from '@/lib/services/topic-similarity';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { topic, currentUserId } = body;

    const result = await checkTopicSimilarity(topic, currentUserId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error checking topic similarity:', err);
    return NextResponse.json({ isSimilar: false, match: null, error: err.message });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get('topic') || '';
    const currentUserId = searchParams.get('currentUserId') || undefined;

    const result = await checkTopicSimilarity(topic, currentUserId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error in GET topic similarity:', err);
    return NextResponse.json({ isSimilar: false, match: null, error: err.message });
  }
}
