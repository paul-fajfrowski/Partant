import type { Account, Booking, Coach, Offer, Preferences } from "./model";
// Missing/null offer IDs preserve legacy availability for every offer.
export type Interval = [
  start: string,
  end: string,
  offerIds?: string[] | null,
  locationIds?: string[] | null,
];
export type Dossier = {
  verification?: import("./verification").Verification;
  publicPractices?: { practice: string; expires: string }[];
  status:
    | "approved"
    | "pending"
    | "correction"
    | "rejected"
    | "draft"
    | "expired";
  documents: string[];
  expires: string;
  reason: string;
  history: {
    date: string;
    status: string;
    reason: string;
    practice?: string;
    by?: string;
  }[];
};
export type CoachLocation = {
  coordinates?: { latitude: number; longitude: number; label: string };
  type: string;
  name: string;
  address: string;
  instructions: string;
  sector?: string;
  radius?: number;
  travelFee?: number;
};
export type CoachSettings = {
  locations?: Record<string, CoachLocation>;
  published: boolean;
  weeklyConfigured: boolean;
  week: Interval[][];
  exceptions: Record<string, Interval[]>;
  blocks: {
    id: string;
    day: string;
    start: string;
    end: string;
    title: string;
  }[];
  buffer: number; // Legacy storage field; normalized to zero.
  departureStep?: number | null; // Legacy storage field; normalized to null.
  notice: number;
  horizon: number;
  cancelHours: number;
  studio: string;
  studioAddress: string;
  radius: number;
  travelFee: number;
  preparation: Record<"provided" | "bring" | "meeting" | "weather", string>;
  notifications: {
    booking: boolean;
    changes: boolean;
    reminder: boolean;
    marketing: boolean;
  };
  business: { name: string; status: string; email: string; address: string };
  payoutReady: boolean;
  dossier: Dossier;
  clientNotes: Record<string, string>;
};
export type PaymentAttempt = {
  id: string;
  owner: string;
  draft: Booking;
  created: number;
  status: "pending" | "refused" | "interrupted" | "expired" | "success";
  method: string;
};
export type Review = {
  id: string;
  booking: string;
  coach: string;
  owner: string;
  name: string;
  rating: number;
  text: string;
  reply: string;
  hidden: boolean;
};
export type Ticket = {
  id: string;
  owner: string;
  coach?: string;
  booking?: string;
  review?: string;
  kind: string;
  body: string;
  status: "open" | "resolved";
  response: string;
  decision?: string;
};
export type Proposal = {
  id: string;
  booking: string;
  before: string;
  target: { day: string; time: string; address: string; offerId?: string };
  reason: string;
  status: "pending" | "accepted" | "declined" | "withdrawn" | "expired";
};
export type AvailabilityAlert = {
  id: string;
  owner: string;
  coach: string;
  sport: string;
  day: string;
  from: string;
  to: string;
  budget: number;
  seats: number;
  groupOnly: boolean;
  format: string;
  active: boolean;
  seen: string[];
};
export type Refund = {
  id: string;
  booking: string;
  amount: number;
  status: "pending" | "settled";
};
export type AccountInfo = {
  phone: string;
  reminders: boolean;
  alerts: boolean;
};
export type ExtendedStore = {
  deletedAccounts?: string[];
  settings?: Record<string, CoachSettings>;
  identities?: Account[];
  extraCoaches?: Coach[];
  attempts?: PaymentAttempt[];
  reviews?: Review[];
  tickets?: Ticket[];
  proposals?: Proposal[];
  alerts?: AvailabilityAlert[];
  refunds?: Refund[];
  accountInfo?: Record<string, AccountInfo>;
  clockHours?: number;
  testMode?: boolean;
};
