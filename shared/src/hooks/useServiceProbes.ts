import { useEffect, useState } from 'react';
import { getRuntimeConfig } from '../lib/runtime-config';

export type ServiceProbeId = 'pakit' | 'nawal' | 'kinich';
export type ServiceProbeState = 'checking' | 'online' | 'offline';
export type ServiceProbeSummary = 'checking' | 'online' | 'degraded' | 'offline';

export interface ServiceProbeStatus {
  id: ServiceProbeId;
  label: string;
  state: ServiceProbeState;
  url: string;
  statusCode: number | null;
  error: string | null;
  checkedAt: number | null;
}

interface ServiceTarget {
  id: ServiceProbeId;
  label: string;
  baseUrl: string;
  fallbackUrls?: string[];
  probePaths: string[];
}

interface UseServiceProbesOptions {
  intervalMs?: number;
  timeoutMs?: number;
}

function withTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

function buildProbeUrls(baseUrl: string, probePaths: string[]): string[] {
  const normalizedBaseUrl = withTrailingSlash(baseUrl);

  return Array.from(
    new Set(
      probePaths.map((probePath) => {
        const path = probePath.replace(/^\/+/, '');
        if (normalizedBaseUrl.startsWith('/')) {
          return `${normalizedBaseUrl}${path}`;
        }
        return new URL(path, normalizedBaseUrl).toString();
      })
    )
  );
}

async function fetchProbe(url: string, timeoutMs: number): Promise<{ ok: boolean; statusCode: number | null; error: string | null }> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });

    return {
      ok: response.ok,
      statusCode: response.status,
      error: response.ok ? null : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      statusCode: null,
      error: error instanceof Error ? error.message : 'Probe failed',
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function probeTarget(target: ServiceTarget, timeoutMs: number): Promise<ServiceProbeStatus> {
  const allBases = Array.from(new Set([target.baseUrl, ...(target.fallbackUrls || [])])).filter(Boolean);
  let lastError: string | null = null;
  let lastStatusCode: number | null = null;

  for (const base of allBases) {
    const candidateUrls = buildProbeUrls(base, target.probePaths);
    for (const url of candidateUrls) {
      const result = await fetchProbe(url, timeoutMs);

      if (result.ok) {
        return {
          id: target.id,
          label: target.label,
          state: 'online',
          url,
          statusCode: result.statusCode,
          error: null,
          checkedAt: Date.now(),
        };
      }

      lastError = result.error;
      lastStatusCode = result.statusCode;
    }
  }

  return {
    id: target.id,
    label: target.label,
    state: 'offline',
    url: target.baseUrl,
    statusCode: lastStatusCode,
    error: lastError,
    checkedAt: Date.now(),
  };
}

function buildInitialStatuses(targets: ServiceTarget[]): ServiceProbeStatus[] {
  return targets.map((target) => ({
    id: target.id,
    label: target.label,
    state: 'checking',
    url: target.baseUrl,
    statusCode: null,
    error: null,
    checkedAt: null,
  }));
}

async function fetchServerProbes(): Promise<Record<string, { ok: boolean; status: string; url?: string }> | null> {
  try {
    const isWallet = typeof window !== 'undefined' && window.location.pathname.startsWith('/wallet');
    const endpoint = isWallet ? '/wallet/api/probes' : '/api/probes';
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 2500);
    const res = await fetch(endpoint, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    window.clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.probes) {
        return data.probes;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function useServiceProbes(options: UseServiceProbesOptions = {}) {
  const { intervalMs = 30000, timeoutMs = 4000 } = options;
  const runtimeConfig = getRuntimeConfig();
  const serviceTargets: ServiceTarget[] = [
    {
      id: 'pakit',
      label: 'Pakit',
      baseUrl: runtimeConfig.pakitApiUrl,
      fallbackUrls: ['http://localhost:8001', 'http://127.0.0.1:8001'],
      probePaths: ['health'],
    },
    {
      id: 'nawal',
      label: 'Nawal',
      baseUrl: runtimeConfig.nawalApiUrl,
      fallbackUrls: ['http://localhost:8080', 'http://127.0.0.1:8080'],
      probePaths: ['health'],
    },
    {
      id: 'kinich',
      label: 'Kinich',
      baseUrl: runtimeConfig.kinichApiUrl,
      fallbackUrls: ['http://localhost:8888', 'http://127.0.0.1:8888'],
      probePaths: ['readyz', 'health'],
    },
  ];

  const [probes, setProbes] = useState<ServiceProbeStatus[]>(() => buildInitialStatuses(serviceTargets));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let cancelled = false;

    const runProbes = async () => {
      // First try server-side probe route to avoid CORS errors
      const serverResults = await fetchServerProbes();
      if (serverResults && !cancelled) {
        const updated: ServiceProbeStatus[] = serviceTargets.map((target) => {
          const s = serverResults[target.id];
          const isOnline = s?.ok ?? false;
          return {
            id: target.id,
            label: target.label,
            state: isOnline ? 'online' : 'offline',
            url: s?.url || target.baseUrl,
            statusCode: isOnline ? 200 : null,
            error: isOnline ? null : 'Unreachable',
            checkedAt: Date.now(),
          };
        });
        setProbes(updated);
        setIsLoading(false);
        return;
      }

      const results = await Promise.all(serviceTargets.map((target) => probeTarget(target, timeoutMs)));

      if (!cancelled) {
        setProbes(results);
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    setProbes(buildInitialStatuses(serviceTargets));
    runProbes();

    const intervalId = window.setInterval(runProbes, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [runtimeConfig.kinichApiUrl, runtimeConfig.nawalApiUrl, runtimeConfig.pakitApiUrl, intervalMs, timeoutMs]);

  const onlineCount = probes.filter((probe) => probe.state === 'online').length;
  const checkedAt = probes.reduce<number | null>((latest, probe) => {
    if (!probe.checkedAt) {
      return latest;
    }

    if (!latest || probe.checkedAt > latest) {
      return probe.checkedAt;
    }

    return latest;
  }, null);

  let summary: ServiceProbeSummary = 'checking';
  if (!isLoading) {
    if (onlineCount === probes.length) {
      summary = 'online';
    } else if (onlineCount === 0) {
      summary = 'offline';
    } else {
      summary = 'degraded';
    }
  }

  return {
    probes,
    isLoading,
    checkedAt,
    onlineCount,
    summary,
  };
}