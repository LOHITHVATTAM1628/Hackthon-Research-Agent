import { NextRequest, NextResponse } from 'next/server';
import { fetchProjectEvolutionData } from '@/lib/services/report-comparison';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: 'Missing research identifier' }, { status: 400 });
    }

    const data = await fetchProjectEvolutionData(id);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error fetching evolution endpoint:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
