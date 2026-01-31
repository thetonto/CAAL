import { NextResponse } from 'next/server';

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://agent:8889';

/**
 * GET /api/tools/n8n-workflows
 * Fetches workflow metadata from n8n (no full workflow JSON).
 * Returns n8n_base_url for building workflow links.
 */
export async function GET() {
  try {
    const res = await fetch(`${WEBHOOK_URL}/n8n-workflows`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[/api/tools/n8n-workflows] Backend error:', res.status, text);
      return NextResponse.json({ error: text || 'Backend error' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[/api/tools/n8n-workflows] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
