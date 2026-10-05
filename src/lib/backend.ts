import { io, type Socket } from "socket.io-client";

/**
 * Thin client for the voice-agent backend (voice-agent/ on Railway/Koyeb).
 *
 * Set NEXT_PUBLIC_BACKEND_URL (e.g. https://your-voice-agent.up.railway.app)
 * and the dashboard switches from demo data to the live backend. Without it,
 * the app stays fully functional on demo data — nothing breaks, it just
 * doesn't receive real calls.
 *
 * Event contracts live in voice-agent/server.js; keep both in sync.
 */

export const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(
  /\/+$/,
  "",
);
export const isBackendConfigured = backendUrl.length > 0;

/**
 * Placeholder tenant id used while the app runs on demo data (and while auth
 * is not implemented). Replace with the signed-in doctor's clinic id once
 * doctor login issues a real one.
 */
export const demoClinicId = "000000000000000000000000";

/** Emitted by voice-agent when the AI books a token during a call. */
export interface TokenBookedEvent {
  clinicId: string;
  tokenNumber: number;
  patientName: string;
  day: "today" | "tomorrow";
  waitMinutes: number;
  lastAssignedToken: number;
}

/** Emitted by voice-agent when the dashboard advances the queue. */
export interface TokenAdvancedEvent {
  clinicId: string;
  servedToken: number;
  currentRunningToken: number;
  lastAssignedToken: number;
}

let socket: Socket | null = null;

/** Process-wide Socket.io connection, subscribed to one clinic's room. */
export function getQueueSocket(clinicId: string): Socket {
  if (!isBackendConfigured) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not set");
  }
  if (!socket) {
    socket = io(backendUrl, {
      transports: ["websocket"],
      auth: { clinicId },
    });
  }
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

/**
 * "Next patient" — advances the server-side queue atomically and returns the
 * new state. The dashboard UI should not advance locally in live mode: the
 * server emits `token:advanced`, which is the single source of truth.
 * Returns null when the backend is not configured or the call failed.
 */
export async function advanceQueue(
  clinicId: string,
): Promise<TokenAdvancedEvent | null> {
  if (!isBackendConfigured) return null;
  try {
    const res = await fetch(`${backendUrl}/api/clinic/next-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clinicId }),
    });
    if (!res.ok) {
      console.error(
        `next-token failed: ${res.status}`,
        await res.text().catch(() => ""),
      );
      return null;
    }
    return (await res.json()) as TokenAdvancedEvent;
  } catch (err) {
    console.error("next-token request failed:", err);
    return null;
  }
}

/** Emitted by voice-agent when a waiting token is cancelled from the dashboard. */
export interface TokenCancelledEvent {
  clinicId: string;
  tokenNumber: number;
  status: "CANCELLED";
}

/** Shape of GET /api/clinic/:id/state (voice-agent). */
export interface ClinicStateResponse {
  clinic: {
    id: string;
    clinicName: string;
    doctorName: string;
    isOnHoliday: boolean;
    currentRunningToken: number;
    lastAssignedToken: number;
    avgMinutesPerToken: number;
  };
  waiting: Array<{
    _id: string;
    token_number: number;
    day: "today" | "tomorrow";
    status: string;
    notes?: string;
    patient_id?: { name?: string } | null;
  }>;
}

/** Initial dashboard hydration before the Socket.io subscription kicks in. */
export async function fetchClinicState(
  clinicId: string,
): Promise<ClinicStateResponse | null> {
  if (!isBackendConfigured) return null;
  try {
    const res = await fetch(`${backendUrl}/api/clinic/${clinicId}/state`);
    if (!res.ok) {
      console.error(`clinic state failed: ${res.status}`);
      return null;
    }
    return (await res.json()) as ClinicStateResponse;
  } catch (err) {
    console.error("clinic state request failed:", err);
    return null;
  }
}

/** Cancel a waiting token. The UI updates via the `token:cancelled` event. */
export async function cancelQueueToken(
  clinicId: string,
  tokenNumber: number,
): Promise<boolean> {
  if (!isBackendConfigured) return false;
  try {
    const res = await fetch(`${backendUrl}/api/clinic/cancel-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clinicId, tokenNumber }),
    });
    if (!res.ok) {
      console.error(
        `cancel-token failed: ${res.status}`,
        await res.text().catch(() => ""),
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error("cancel-token request failed:", err);
    return false;
  }
}
