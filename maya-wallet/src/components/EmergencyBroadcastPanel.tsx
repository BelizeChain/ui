'use client';

import { useCallback, useEffect, useState } from 'react';
import { CircleNotch, PaperPlaneTilt, ShieldWarning } from 'phosphor-react';
import { useMessaging } from '@/contexts/MessagingContext';
import { useUIStore } from '@/store/ui';
import { isEmergencyAuthority } from '@/services/pallets/mesh';

/**
 * Severity / type / district option lists mirror the `pallet_belize_mesh` enums
 * exactly. The mesh service maps these keys onto the on-chain enum variants, so
 * a key that is not in those enums would be rejected at submission time.
 */
const SEVERITIES = ['advisory', 'watch', 'warning', 'emergency', 'catastrophic'] as const;

const ALERT_TYPES = [
  'hurricane',
  'tropicalStorm',
  'flooding',
  'earthquake',
  'tsunami',
  'wildfire',
  'severeWeather',
  'publicSafety',
  'infrastructureFailure',
  'medicalEmergency',
  'searchAndRescue',
  'general',
] as const;

const DISTRICTS = ['belize', 'cayo', 'corozal', 'orangewalk', 'stanncreek', 'toledo'] as const;

const MAX_MESSAGE_BYTES = 128;

interface Props {
  /** Connected account; the panel renders only when it is a NEMO authority. */
  address: string;
}

/**
 * Emergency-alert issuance form for registered NEMO authorities.
 *
 * This self-gates: it checks `mesh.emergencyAuthorities` and renders nothing for
 * ordinary accounts, so the parent keeps its read-only explanation. The
 * capability has existed in `MessagingContext` but was never reachable from any
 * screen.
 */
export default function EmergencyBroadcastPanel({ address }: Props) {
  const { submitEmergencyBroadcast } = useMessaging();
  const { addNotification } = useUIStore();

  const [isAuthority, setIsAuthority] = useState(false);
  const [checked, setChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [severity, setSeverity] = useState<(typeof SEVERITIES)[number]>('warning');
  const [alertType, setAlertType] = useState<(typeof ALERT_TYPES)[number]>('severeWeather');
  const [district, setDistrict] = useState<(typeof DISTRICTS)[number]>('belize');
  const [message, setMessage] = useState('');
  const [radiusMeters, setRadiusMeters] = useState('5000');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => isEmergencyAuthority(address))
      .then((result) => {
        if (cancelled) return;
        setIsAuthority(result);
        setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  const messageBytes = new TextEncoder().encode(message).length;
  const overLimit = messageBytes > MAX_MESSAGE_BYTES;

  const handleSubmit = useCallback(async () => {
    if (overLimit || message.trim().length === 0) return;
    const lat = Number.parseFloat(latitude);
    const lon = Number.parseFloat(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      addNotification({ type: 'error', message: 'Latitude and longitude are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const hash = await submitEmergencyBroadcast({
        level: severity,
        district,
        alertType,
        latitude: lat,
        longitude: lon,
        radiusMeters: Number.parseInt(radiusMeters, 10) || 0,
        message: message.trim(),
        durationMinutes: Number.parseInt(durationMinutes, 10) || 60,
      });
      addNotification({ type: 'success', message: `Emergency alert issued: ${hash.slice(0, 18)}…` });
      setMessage('');
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Could not issue alert: ${(error as Error).message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    addNotification,
    alertType,
    district,
    durationMinutes,
    latitude,
    longitude,
    message,
    overLimit,
    radiusMeters,
    severity,
    submitEmergencyBroadcast,
  ]);

  // Not an authority (or still checking) — the parent shows the read-only notice.
  if (!checked || !isAuthority) return null;

  const fieldClass =
    'w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50';

  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/40 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldWarning size={20} weight="fill" className="text-amber-400" />
        <h3 className="text-sm font-bold text-amber-300">Issue Emergency Alert</h3>
        <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider">
          NEMO authority
        </span>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Broadcasts a real <span className="font-mono">mesh.issue_emergency_alert</span> extrinsic.
        The alert is immutably attributed to your account and relayed over the LoRa mesh.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Severity</span>
          <select
            value={severity}
            onChange={(event) => setSeverity(event.target.value as (typeof SEVERITIES)[number])}
            className={fieldClass}
          >
            {SEVERITIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Type</span>
          <select
            value={alertType}
            onChange={(event) => setAlertType(event.target.value as (typeof ALERT_TYPES)[number])}
            className={fieldClass}
          >
            {ALERT_TYPES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">District</span>
          <select
            value={district}
            onChange={(event) => setDistrict(event.target.value as (typeof DISTRICTS)[number])}
            className={fieldClass}
          >
            {DISTRICTS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-[10px] uppercase font-bold text-slate-500">
          Message ({messageBytes}/{MAX_MESSAGE_BYTES} bytes)
        </span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          placeholder="e.g. Hurricane warning: Category 3 landfall expected within 12 hours. Evacuate coastal areas."
          className={`${fieldClass} resize-none ${overLimit ? 'border-rose-500' : ''}`}
        />
        {overLimit && (
          <span className="text-[11px] text-rose-400">
            Message exceeds the pallet&apos;s 128-byte limit and will be rejected.
          </span>
        )}
      </label>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <label className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Latitude</span>
          <input
            type="number"
            value={latitude}
            onChange={(event) => setLatitude(event.target.value)}
            placeholder="17.5"
            className={fieldClass}
          />
        </label>

        <label className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Longitude</span>
          <input
            type="number"
            value={longitude}
            onChange={(event) => setLongitude(event.target.value)}
            placeholder="-88.2"
            className={fieldClass}
          />
        </label>

        <label className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Radius (m)</span>
          <input
            type="number"
            value={radiusMeters}
            onChange={(event) => setRadiusMeters(event.target.value)}
            className={fieldClass}
          />
        </label>

        <label className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Duration (min)</span>
          <input
            type="number"
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(event.target.value)}
            className={fieldClass}
          />
        </label>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || overLimit || message.trim().length === 0}
        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20"
      >
        {isSubmitting ? (
          <>
            <CircleNotch size={16} className="animate-spin" />
            Broadcasting…
          </>
        ) : (
          <>
            <PaperPlaneTilt size={16} weight="fill" />
            Issue Alert On Chain
          </>
        )}
      </button>
    </div>
  );
}
