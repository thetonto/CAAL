import { NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

const REGISTRY_URL = 'https://registry.caal.io/index.json';
const LOCAL_REGISTRY_PATH =
  process.env.TOOLS_REGISTRY_PATH || '/home/cmac/CoreWorx/2 - Development/caal-tools';

export async function GET() {
  const useLocal = process.env.TOOLS_REGISTRY_LOCAL === 'true';

  try {
    let data;

    if (useLocal) {
      const indexPath = path.join(LOCAL_REGISTRY_PATH, 'docs', 'index.json');

      if (!existsSync(indexPath)) {
        console.error('[/api/tools/registry] Local index.json not found:', indexPath);
        return NextResponse.json(
          { error: 'Registry index not found. Run generate-index.js first.' },
          { status: 404 }
        );
      }

      const content = await readFile(indexPath, 'utf-8');
      data = JSON.parse(content);
    } else {
      const res = await fetch(REGISTRY_URL, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      if (!res.ok) {
        console.error('[/api/tools/registry] Registry fetch failed:', res.status);
        return NextResponse.json({ error: 'Failed to fetch registry' }, { status: res.status });
      }

      data = await res.json();
    }

    return NextResponse.json({ tools: data, source: useLocal ? 'local' : 'registry' });
  } catch (error) {
    console.error('[/api/tools/registry] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
