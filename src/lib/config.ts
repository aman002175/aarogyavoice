import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Frontend-only configuration. The voice backend (voice-agent/) is not wired
 * yet, so the app runs entirely on mock data. Real values are injected later
 * from the env keys voice-agent/env.example documents (MONGO_URI,
 * TWILIO_AUTH_TOKEN, DEEPGRAM_API_KEY, GROQ_API_KEY, ...).
 */
export const appConfig = {
  name: "Aarogya Voice",
  supportEmail: "support@aarogyavoice.com",
} as const;

/** Marketing copy lives here so the page component stays structural. */
export const hero = {
  eyebrow: "Answers in Hindi and English",
  title: "Your clinic's receptionist, on duty 24/7",
  body: "Aarogya Voice picks up every patient call, tells them where they stand in the queue, and books the token while you stay with the patient in front of you.",
  primaryCta: "Start 14-day free trial",
  secondaryCta: "See the queue display",
  reassurance: "No credit card · Your own phone number · Cancel anytime",
} as const;

export const howItWorks = [
  {
    n: "01",
    title: "Patient calls your number",
    body: "Nobody needs to pick up. Aarogya Voice answers on the first ring — day, night, or festival.",
  },
  {
    n: "02",
    title: "It handles the conversation",
    body: "It gives live queue status, an honest wait estimate, your clinic hours, and books a token when the queue is open.",
  },
  {
    n: "03",
    title: "You just treat patients",
    body: "Bookings land in your dashboard and a token appears on the waiting-room screen.",
  },
] as const;

export const features = [
  {
    icon: "clock",
    title: "Answers at 3 AM",
    body: "Full availability with zero staff. Patients never hear a dead line or an after-hours tape.",
  },
  {
    icon: "globe",
    title: "Speaks their language",
    body: "Natural Hindi and English voices, tuned for Indian accents and everyday phrasing.",
  },
  {
    icon: "mic",
    title: "Real-time queue answers",
    body: "Callers hear their current token and a straight estimate of how long the wait will be.",
  },
  {
    icon: "calendar",
    title: "Books while it talks",
    body: "Tokens fill from the call itself. No follow-up phone tag, no no-shows.",
  },
  {
    icon: "shield",
    title: "Honest about closures",
    body: "Leave, holidays, and closed hours are handled as an offer to rebook, not a dead line.",
  },
  {
    icon: "sparkles",
    title: "Zero calendar setup",
    body: "No migration and no scheduling software. A token queue is the entire workflow.",
  },
] as const;

export const pricingPlans = [
  {
    id: "starter",
    name: "Starter",
    price: "₹1,499",
    cadence: "/month",
    description: "For solo practitioners taking their first calls.",
    minutes: "300 voice minutes",
    features: [
      "1 dedicated clinic phone number",
      "Live token queue display",
      "Token booking by voice",
      "Hindi + English voice",
      "Email support",
    ],
    cta: "Start free trial",
    featured: false,
  },
  {
    id: "clinic",
    name: "Clinic",
    price: "₹3,999",
    cadence: "/month",
    description: "For multi-chair clinics with a front-desk team.",
    minutes: "1,200 voice minutes",
    features: [
      "Everything in Starter",
      "Unlimited queue display screens",
      "SMS + WhatsApp confirmations",
      "Clinic hours & holiday controls",
      "Priority support",
    ],
    cta: "Start free trial",
    featured: true,
  },
  {
    id: "chain",
    name: "Chain",
    price: "Custom",
    cadence: "",
    description: "For hospital groups and multi-location practices.",
    minutes: "Unlimited voice minutes",
    features: [
      "Everything in Clinic",
      "Multi-location dashboard",
      "Super-admin phone allocation",
      "Usage & revenue analytics",
      "Dedicated success manager",
    ],
    cta: "Talk to sales",
    featured: false,
  },
] as const;

export const faqs = [
  {
    q: "Does it work when my clinic is closed?",
    a: "Yes. Aarogya Voice stays live around the clock. When the clinic is closed, it tells the caller your working hours and offers to book a token for the next open day instead of a dead line.",
  },
  {
    q: "Will patients know they are talking to an AI?",
    a: "It introduces itself honestly as a voice assistant for the clinic. Patients care about getting an answer, and being upfront builds trust in your practice.",
  },
  {
    q: "Which languages are supported?",
    a: "Hindi and English at launch, including common Indian accents.",
  },
  {
    q: "Do I need to change how my staff works?",
    a: "No calendar migration required. The dashboard shows a token queue your team already understands, plus one-tap 'Next patient' and open/close controls.",
  },
  {
    q: "What happens to my patients' details?",
    a: "The waiting-room display shows token numbers and wait times only. Patient names and reasons stay in the doctor dashboard, and each clinic's records are isolated from every other clinic's.",
  },
] as const;