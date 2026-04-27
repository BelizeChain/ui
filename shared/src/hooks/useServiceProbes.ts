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
      probePaths.map((probePath) => new URL(probePath.replace(/^\/+/, ''), normalizedBaseUrl).toString())
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
  const candidateUrls = buildProbeUrls(target.baseUrl, target.probePaths);
  let lastError: string | null = null;
  let lastStatusCode: number | null = null;

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

  return {
    id: target.id,
    label: target.label,
    state: 'offline',
    url: candidateUrls[0] || target.baseUrl,
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

export function useServiceProbes(options: UseServiceProbesOptions = {}) {
  const { intervalMs = 30000, timeoutMs = 4000 } = options;
  const runtimeConfig = getRuntimeConfig();
  const serviceTargets: ServiceTarget[] = [
    {
      id: 'pakit',
      label: 'Pakit',
      baseUrl: runtimeConfig.pakitApiUrl,
      probePaths: ['health'],
    },
    {
      id: 'nawal',
      label: 'Nawal',
      baseUrl: runtimeConfig.nawalApiUrl,
      probePaths: ['health'],
    },
    {
      id: 'kinich',
      label: 'Kinich',
      baseUrl: runtimeConfig.kinichApiUrl,
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