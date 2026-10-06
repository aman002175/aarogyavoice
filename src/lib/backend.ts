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

/**
 * Process-wide Socket.io connection, subscribed to one clinic's room.
 * The doctor JWT goes in the handshake — the backend derives the room from
 * the token's `sub`, so a client-supplied clinicId is never trusted.
 * If the signed-in clinic changes (login after mount), the connection is
 * recreated because the handshake auth is fixed at connect time.
 */
export function getQueueSocket(clinicId: string): Socket {
  if (!isBackendConfigured) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not set");
  }
  const token = getDoctorToken() ?? undefined;
  if (socket && (socket.auth as { clinicId?: string } | undefined)?.clinicId !== clinicId) {
    socket.disconnect();
    socket = null;
  }
  if (!socket) {
    socket = io(backendUrl, {
      transports: ["websocket"],
      auth: { clinicId, token },
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
      headers: doctorAuthHeaders(),
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
    const res = await fetch(`${backendUrl}/api/clinic/${clinicId}/state`, {
      headers: doctorAuthHeaders(),
    });
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
      headers: doctorAuthHeaders(),
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

// ---------------------------------------------------------------------------
// Doctor auth (dashboard)
// JWT is kept in localStorage (per-tab usable). The backend derives the
// tenant from the token's `sub` — the client never supplies a clinicId for
// authorization decisions. Login errors are intentionally generic.
// ---------------------------------------------------------------------------

const DOCTOR_TOKEN_KEY = "aarogya_doctor_token";

export function getDoctorToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(DOCTOR_TOKEN_KEY);
}

export function setDoctorToken(token: string): void {
  try {
    localStorage.setItem(DOCTOR_TOKEN_KEY, token);
  } catch {
    // Private mode / storage quota — the session just won't persist.
  }
}

export function clearDoctorToken(): void {
  try {
    localStorage.removeItem(DOCTOR_TOKEN_KEY);
  } catch {
    // ignore
  }
}

const DOCTOR_WORKSPACE_KEY = "aarogya_doctor_workspace";

/** Cached workspace snapshot (id/name) so the UI can hydrate before /me. */
export function setDoctorWorkspace(ws: DoctorWorkspace): void {
  try {
    localStorage.setItem(DOCTOR_WORKSPACE_KEY, JSON.stringify(ws));
  } catch {
    // ignore
  }
}

export function getDoctorWorkspace(): DoctorWorkspace | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DOCTOR_WORKSPACE_KEY);
    return raw ? (JSON.parse(raw) as DoctorWorkspace) : null;
  } catch {
    return null;
  }
}

/** Authorization header for clinic endpoints (Content-Type included). */
export function doctorAuthHeaders(): Record<string, string> {
  const token = getDoctorToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export interface DoctorWorkspace {
  id: string;
  clinicName: string;
  doctorName: string;
  twilioNumber: string;
}

export async function doctorLogin(
  email: string,
  password: string,
): Promise<AdminResult<{ token: string; expiresInMs: number; clinic: DoctorWorkspace }>> {
  if (!isBackendConfigured) {
    return { ok: false, status: 0, error: "NEXT_PUBLIC_BACKEND_URL is not set" };
  }
  try {
    const res = await fetch(`${backendUrl}/api/auth/doctor-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      return { ok: false, status: res.status, error: body.error || `HTTP ${res.status}` };
    }
    return {
      ok: true,
      data: body as { token: string; expiresInMs: number; clinic: DoctorWorkspace },
    };
  } catch (err) {
    console.error("doctor-login request failed:", err);
    return { ok: false, status: 0, error: "Network error" };
  }
}

/** Who am I — re-hydrates the workspace after a refresh using the stored JWT. */
export async function fetchDoctorMe(): Promise<AdminResult<{ clinic: DoctorWorkspace }>> {
  if (!isBackendConfigured) {
    return { ok: false, status: 0, error: "NEXT_PUBLIC_BACKEND_URL is not set" };
  }
  try {
    const res = await fetch(`${backendUrl}/api/auth/doctor-me`, {
      headers: doctorAuthHeaders(),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      return { ok: false, status: res.status, error: body.error || `HTTP ${res.status}` };
    }
    return { ok: true, data: body as { clinic: DoctorWorkspace } };
  } catch (err) {
    console.error("doctor-me request failed:", err);
    return { ok: false, status: 0, error: "Network error" };
  }
}

// ---------------------------------------------------------------------------
// Super-admin console (hidden /aarogya-super-admin route)
// Session lives in an HttpOnly cookie on the backend; the custom header is a
// CSRF defense that cross-site pages cannot forge.
// ---------------------------------------------------------------------------

const ADMIN_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
  "X-Aarogya-Admin": "1",
};

export interface AdminClinic {
  id: string;
  clinicName: string;
  doctorName: string;
  twilioNumber: string;
  planStatus: string;
  planExpiresAt: string | null;
  currentRunningToken: number;
  lastAssignedToken: number;
  isOnHoliday: boolean;
}

type AdminResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

async function adminFetch<T>(path: string, init?: RequestInit): Promise<AdminResult<T>> {
  if (!isBackendConfigured) {
    return { ok: false, status: 0, error: "NEXT_PUBLIC_BACKEND_URL is not set" };
  }
  try {
    const res = await fetch(`${backendUrl}${path}`, {
      credentials: "include",
      ...init,
      headers: { ...ADMIN_HEADERS, ...(init?.headers ?? {}) },
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string } & T;
    if (!res.ok) {
      return { ok: false, status: res.status, error: body.error || `HTTP ${res.status}` };
    }
    return { ok: true, data: body as T };
  } catch (err) {
    console.error(`admin request failed: ${path}`, err);
    return { ok: false, status: 0, error: "Network error" };
  }
}

export function adminLogin(
  adminId: string,
  password: string,
): Promise<AdminResult<{ ok: true }>> {
  return adminFetch("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ adminId, password }),
  });
}

export function fetchAdminClinics(): Promise<AdminResult<{ clinics: AdminClinic[] }>> {
  return adminFetch("/api/admin/clinics");
}

export function adminLogout(): Promise<AdminResult<{ ok: true }>> {
  return adminFetch("/api/admin/logout", { method: "POST" });
}
