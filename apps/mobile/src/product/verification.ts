import type { Coach, Offer } from "./model";
import type { Dossier } from "./extendedTypes";
import reference from "../reference/prototype.json";

export const practiceOptions = Object.keys(reference.sportGoals).filter(
  (x) => x !== "Tout",
);
export const professionalStatuses = [
  ["qualified", "Professionnel qualifié"],
  ["trainee", "En cours de formation"],
  ["foreign", "Qualification obtenue à l’étranger"],
  ["specific", "Situation particulière à examiner"],
] as const;
export type ProfessionalStatus = (typeof professionalStatuses)[number][0];
export const proofKinds = {
  identity: "Identité",
  insurance: "Assurance professionnelle",
  qualification: "Diplôme ou certification",
  card: "Carte professionnelle",
  trainee: "Attestation de stagiaire",
  recognition: "Reconnaissance de qualification",
  renewal: "Attestation de recyclage",
  supporting: "Justificatif complémentaire",
};
export type ProofKind = keyof typeof proofKinds;
export type Proof = {
  id: string;
  kind: ProofKind;
  title: string;
  path: string;
  expires: string;
  practices: string[];
  reference: string;
};
export type PracticeReview = {
  status:
    | "draft"
    | "pending"
    | "approved"
    | "correction"
    | "rejected"
    | "expired";
  fingerprint: string;
  reason: string;
  at: string;
  by?: string;
};
export type Verification = {
  version: 2;
  professionalStatus: ProfessionalStatus;
  practices: string[];
  context: string;
  files: Proof[];
  reviews: Record<string, PracticeReview>;
};
export type VerificationInput = Omit<Verification, "version" | "reviews">;
export const reviewLabels: Record<PracticeReview["status"], string> = {
  draft: "À compléter",
  pending: "En vérification",
  approved: "Validée",
  correction: "À corriger",
  rejected: "Non autorisée",
  expired: "À renouveler",
};
export function selectedPractices(c: Coach) {
  return c.disciplines ?? (practiceOptions.includes(c.sport) ? [c.sport] : []);
}
const common = (f: Proof) => ["identity", "insurance"].includes(f.kind);
export const filesFor = (v: Verification, practice: string) =>
  v.files.filter((f) => common(f) || f.practices.includes(practice));
// Fingerprints contain only dependencies of THIS practice. Extending a document's
// scope to another practice never grants that practice approval or invalidates this one.
export function proofFingerprint(v: Verification, practice: string) {
  return JSON.stringify([
    v.professionalStatus,
    practice,
    v.context,
    filesFor(v, practice)
      .map((f) => [f.id, f.kind, f.path, f.expires, f.reference])
      .sort((a, b) => a[0].localeCompare(b[0])),
  ]);
}
export function requirements(v: Verification, practice: string): ProofKind[] {
  const common: ProofKind[] = ["identity", "insurance"];
  if (v.professionalStatus === "trainee") return [...common, "trainee"];
  const base: ProofKind[] = [...common, "qualification"];
  if (
    v.professionalStatus === "specific" ||
    ["Yoga", "Récupération"].includes(practice)
  )
    return base;
  return [
    ...base,
    "card",
    ...(v.professionalStatus === "foreign" ? ["recognition" as const] : []),
  ];
}
export function reviewHint(v: Verification, practice: string) {
  if (v.professionalStatus === "trainee")
    return "Précisez votre formation, votre tuteur et les conditions d’encadrement.";
  if (v.professionalStatus === "foreign")
    return "L’équipe vérifiera la reconnaissance et le champ d’exercice de votre qualification.";
  if (
    v.professionalStatus === "specific" ||
    ["Yoga", "Récupération"].includes(practice)
  )
    return "Décrivez précisément vos séances. L’équipe examinera le cadre applicable avant toute autorisation.";
  if (practice === "Natation")
    return "L’équipe vérifiera les prérogatives d’enseignement et le recyclage applicable à votre qualification.";
  return "L’équipe vérifiera que vos qualifications couvrent cette pratique et les publics accompagnés.";
}
export function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function missingProofs(v: Verification, practice: string, date: string) {
  const docs = filesFor(v, practice);
  return requirements(v, practice).filter(
    (kind) =>
      !docs.some(
        (f) =>
          f.kind === kind && f.path.trim() && (!f.expires || f.expires >= date),
      ),
  );
}
export function practiceState(
  v: Verification,
  practice: string,
  date: string,
): PracticeReview["status"] {
  const r = v.reviews[practice];
  if (!r || r.fingerprint !== proofFingerprint(v, practice)) return "draft";
  if (filesFor(v, practice).some((f) => f.expires && f.expires < date))
    return "expired";
  return r.status;
}
export function approvedPractices(d: Dossier, date: string): string[] {
  if (d.publicPractices)
    return d.publicPractices
      .filter((p) => !p.expires || p.expires >= date)
      .map((p) => p.practice);
  const v = d.verification;
  return v
    ? v.practices.filter((p) => practiceState(v, p, date) === "approved")
    : [];
}
export function canOffer(
  d: Dossier,
  c: Coach,
  offer: Offer | undefined,
  date: string,
) {
  if (!d.verification && !d.publicPractices)
    return d.status === "approved" && d.expires >= date;
  const approved = approvedPractices(d, date);
  return offer
    ? approved.includes(offer.discipline ?? c.sport)
    : approved.length > 0;
}
export function toVerification(
  d: Dossier,
  c: Coach,
  date: string,
): Verification {
  if (d.verification) return JSON.parse(JSON.stringify(d.verification));
  const practices = selectedPractices(c);
  const kinds: ProofKind[] = ["identity", "qualification", "card", "insurance"];
  const v: Verification = {
    version: 2,
    professionalStatus: "qualified",
    practices,
    context: "",
    files: d.documents.flatMap((path, i) =>
      path && kinds[i]
        ? [
            {
              id: `legacy-${i}`,
              kind: kinds[i],
              title: proofKinds[kinds[i]],
              path,
              expires: ["card", "insurance"].includes(kinds[i])
                ? d.expires
                : "",
              practices: [...practices],
              reference: "",
            },
          ]
        : [],
    ),
    reviews: {},
  };
  // Only preserve the previously declared principal practice; never extend a
  // legacy global decision to a newly selected discipline.
  if (
    practices.includes(c.sport) &&
    ["approved", "pending", "correction", "rejected"].includes(d.status)
  )
    v.reviews[c.sport] = {
      status: d.status as PracticeReview["status"],
      fingerprint: proofFingerprint(v, c.sport),
      reason: d.reason,
      at: "",
    };
  return v;
}
export function summarizeDossier(
  d: Dossier,
  v: Verification,
  date: string,
): Dossier {
  const states = v.practices.map((p) => practiceState(v, p, date));
  const status = states.includes("pending")
    ? "pending"
    : states.includes("correction")
      ? "correction"
      : states.includes("expired")
        ? "expired"
        : states.includes("draft")
          ? "draft"
          : states.includes("approved")
            ? "approved"
            : states.includes("rejected")
              ? "rejected"
              : "draft";
  const expires =
    v.files
      .map((f) => f.expires)
      .filter(Boolean)
      .sort()[0] ?? "9999-12-31";
  return {
    ...d,
    status,
    expires,
    documents: v.files.map((f) => f.path),
    verification: v,
  };
}
export function cleanVerification(
  input: VerificationInput,
  owner: string,
  connected: boolean,
): VerificationInput {
  if (
    !input ||
    !professionalStatuses.some(([key]) => key === input.professionalStatus) ||
    !Array.isArray(input.practices) ||
    !input.practices.length ||
    input.practices.length > 20 ||
    new Set(input.practices).size !== input.practices.length ||
    input.practices.some((p) => !practiceOptions.includes(p)) ||
    !Array.isArray(input.files) ||
    input.files.length > 30
  )
    throw Error("Choisissez votre statut et au moins une pratique.");
  if (new Set(input.files.map((f) => f.id)).size !== input.files.length)
    throw Error("Un document apparaît plusieurs fois.");
  const paths = input.files.map((f) => f.path).filter(Boolean);
  if (new Set(paths).size !== paths.length)
    throw Error(
      "Associez le document existant à plusieurs pratiques plutôt que de l’ajouter deux fois.",
    );
  const files = input.files.map((f) => {
    if (
      !/^[\w-]{1,80}$/.test(f.id) ||
      !Object.hasOwn(proofKinds, f.kind) ||
      typeof f.path !== "string" ||
      f.path.length > 500 ||
      !f.path.trim() ||
      (connected &&
        (!f.path.startsWith(owner + "/") ||
          f.path.includes("..") ||
          !/^[\w/-]+\.(pdf|jpg|jpeg|png|webp)$/.test(f.path))) ||
      (f.expires && !validDate(f.expires)) ||
      !Array.isArray(f.practices) ||
      f.practices.some((p) => !input.practices.includes(p))
    )
      throw Error(
        "Vérifiez les fichiers, leurs pratiques et leurs dates de validité.",
      );
    if (
      ["insurance", "card", "trainee", "renewal"].includes(f.kind) &&
      !f.expires
    )
      throw Error(`Indiquez la fin de validité : ${proofKinds[f.kind]}.`);
    return {
      id: f.id,
      kind: f.kind,
      title: String(f.title || proofKinds[f.kind])
        .trim()
        .slice(0, 120),
      path: f.path.trim(),
      expires: f.expires || "",
      practices: [...new Set(f.practices)],
      reference: String(f.reference || "")
        .trim()
        .slice(0, 120),
    };
  });
  return {
    professionalStatus: input.professionalStatus,
    practices: [...input.practices],
    context: String(input.context || "")
      .trim()
      .slice(0, 1500),
    files,
  };
}
export function pendingPractices(d: Dossier, c: Coach, date: string) {
  const v = toVerification(d, c, date);
  return v.practices.filter((p) => practiceState(v, p, date) === "pending");
}
export function publicVerification(d: Dossier, date: string) {
  if (!d.verification) return {};
  return {
    publicPractices: approvedPractices(d, date).map((practice) => ({
      practice,
      expires:
        filesFor(d.verification!, practice)
          .map((f) => f.expires)
          .filter(Boolean)
          .sort()[0] || "",
    })),
  };
}
