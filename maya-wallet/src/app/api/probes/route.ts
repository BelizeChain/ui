import { NextResponse } from 'next/server';

interface ProbeTarget {
  id: string;
  urls: string[];
}

const TARGETS: ProbeTarget[] = [
  {
    id: 'pakit',
    urls: [
      'http://127.0.0.1:8001/health',
      'http://localhost:8001/health',
      'https://100.81.45.25/api/pakit/health',
      'http://100.81.45.25:8001/health',
    ],
  },
  {
    id: 'nawal',
    urls: [
      'http://127.0.0.1:8080/health',
      'http://localhost:8080/health',
      'https://100.81.45.25/api/nawal/health',
      'http://100.81.45.25:8080/health',
    ],
  },
  {
    id: 'kinich',
    urls: [
      'http://127.0.0.1:8888/readyz',
      'http://127.0.0.1:8888/health',
      'http://localhost:8888/health',
      'https://100.81.45.25/api/kinich/health',
      'http://100.81.45.25:8888/health',
    ],
  },
];

async function checkUrl(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1800);
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const results: Record<string, { ok: boolean; status: string; url?: string }> = {};

  await Promise.all(
    TARGETS.map(async (target) => {
      for (const url of target.urls) {
        const isOk = await checkUrl(url);
        if (isOk) {
          results[target.id] = { ok: true, status: 'online', url };
          return;
        }
      }
      results[target.id] = { ok: false, status: 'offline' };
    })
  );

  return NextResponse.json({
    timestamp: Date.now(),
    probes: results,
  });
}
