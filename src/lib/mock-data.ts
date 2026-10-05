export type AppointmentStatus = "WAITING" | "COMPLETED" | "CANCELLED";

export interface Appointment {
  id: string;
  patientName: string;
  tokenNumber: number;
  time: string;
  reason: string;
  status: AppointmentStatus;
}

export interface Clinic {
  name: string;
  doctorName: string;
  speciality: string;
  isOpen: boolean;
  currentToken: number;
  openTime: string;
  closeTime: string;
  slotDuration: number;
}

/**
 * Phone numbers are deliberately absent from this shape. The patient-facing
 * queue screen renders from `queueBoard`, which carries token numbers only —
 * no names, no reasons. That keeps the public display screen free of PHI.
 */
export const demoClinic: Clinic = {
  name: "Aarogya Dental Care",
  doctorName: "Dr. Ananya Sharma",
  speciality: "Dentist",
  isOpen: true,
  currentToken: 7,
  openTime: "09:00",
  closeTime: "18:00",
  slotDuration: 15,
};

export const demoAppointments: Appointment[] = [
  {
    id: "apt_01",
    patientName: "Rohit Verma",
    tokenNumber: 7,
    time: "10:30",
    reason: "Root canal follow-up",
    status: "WAITING",
  },
  {
    id: "apt_02",
    patientName: "Meera Iyer",
    tokenNumber: 8,
    time: "10:45",
    reason: "Teeth scaling",
    status: "WAITING",
  },
  {
    id: "apt_03",
    patientName: "Arjun Nair",
    tokenNumber: 9,
    time: "11:00",
    reason: "Tooth pain consultation",
    status: "WAITING",
  },
  {
    id: "apt_04",
    patientName: "Sunita Desai",
    tokenNumber: 10,
    time: "11:15",
    reason: "Braces adjustment",
    status: "WAITING",
  },
  {
    id: "apt_05",
    patientName: "Karthik Menon",
    tokenNumber: 11,
    time: "11:30",
    reason: "Implant review",
    status: "WAITING",
  },
  {
    id: "apt_06",
    patientName: "Priya Kulkarni",
    tokenNumber: 12,
    time: "11:45",
    reason: "Dental cleaning",
    status: "WAITING",
  },
  {
    id: "apt_07",
    patientName: "Vikram Rao",
    tokenNumber: 6,
    time: "10:15",
    reason: "Filling",
    status: "COMPLETED",
  },
  {
    id: "apt_08",
    patientName: "Neha Gupta",
    tokenNumber: 5,
    time: "10:00",
    reason: "Routine check-up",
    status: "COMPLETED",
  },
  {
    id: "apt_09",
    patientName: "Imran Sheikh",
    tokenNumber: 13,
    time: "12:00",
    reason: "Wisdom tooth extraction",
    status: "CANCELLED",
  },
];

export const clinicStats = {
  callsToday: 34,
  appointmentsBooked: 19,
  avgWaitMins: 12,
  trialDaysLeft: 9,
};

export const weeklyCalls = [
  { day: "Mon", calls: 28, booked: 14 },
  { day: "Tue", calls: 41, booked: 23 },
  { day: "Wed", calls: 36, booked: 19 },
  { day: "Thu", calls: 52, booked: 31 },
  { day: "Fri", calls: 47, booked: 28 },
  { day: "Sat", calls: 33, booked: 17 },
  { day: "Sun", calls: 12, booked: 6 },
];

/**
 * The token currently being served. Derived from the head of the waiting
 * queue rather than stored as its own counter — a stored counter drifts the
 * moment a patient is cancelled or completed, and the waiting-room screen
 * then announces a token nobody is being called for.
 */
export const servingToken =
  demoAppointments
    .filter((a) => a.status === "WAITING")
    .sort((a, b) => a.tokenNumber - b.tokenNumber)[0]?.tokenNumber ??
  demoClinic.currentToken;

/**
 * Queue rows for the patient-facing display. Token number and wait estimate
 * only — the doctor dashboard holds the patient identities.
 *
 * Derived from `demoAppointments` so the display can never disagree with the
 * dashboard about who is waiting or what comes next.
 */
export const waitingQueue = demoAppointments
  .filter((a) => a.status === "WAITING")
  .sort((a, b) => a.tokenNumber - b.tokenNumber);

export const queueBoard = waitingQueue
  .filter((a) => a.tokenNumber > servingToken)
  .map((a, i) => ({
    token: a.tokenNumber,
    wait: `${(i + 1) * 8} min`,
  }));

/**
 * Capability claims, not traction. These describe what the product does and
 * are verifiable from the build itself, so they need no invented customer
 * counts, testimonials, or logos to stand up.
 */
export const capabilities = [
  { value: "24/7", label: "Every call answered" },
  { value: "2", label: "Languages at launch" },
  { value: "1 click", label: "To advance the queue" },
  { value: "0", label: "Calendar integrations" },
];