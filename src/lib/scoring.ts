// Simple, explainable scoring for provider submissions (v1)
// Weights approved in LAUNCH_SCOPE_AND_PLAN.md

export type SubmissionInput = {
  serviceAreas?: string[];
  languages?: string[];
  credentials?: string[];
  experienceTags?: string[];
  capacityFlag?: boolean;
  earliestStartDate?: string;
  coverNote?: string;
};

export type ReferralContext = {
  serviceType?: string;
  preferredAreas?: string[];
  preferredLanguages?: string[];
  requiredCredentials?: string[];
};

function normalizeArray(arr?: string[]): string[] {
  return Array.isArray(arr)
    ? arr.map((s) => String(s).trim().toLowerCase()).filter(Boolean)
    : [];
}

function jaccard(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  for (const v of A) if (B.has(v)) inter += 1;
  const uni = new Set([...a, ...b]).size;
  return inter / uni;
}

export function computeSubmissionScore(
  submission: SubmissionInput,
  referral: ReferralContext
): number {
  const weights = {
    serviceType: 25,
    geo: 25,
    credentials: 15,
    capacity: 10,
    earliestStart: 10,
    languages: 5,
    priorConnection: 5, // placeholder – caller can add externally
    quality: 5,
  } as const;

  // Geo match (areas overlap)
  const geoScore = jaccard(
    normalizeArray(submission.serviceAreas),
    normalizeArray(referral.preferredAreas)
  );

  // Credentials match
  const credScore = jaccard(
    normalizeArray(submission.credentials),
    normalizeArray(referral.requiredCredentials)
  );

  // Languages match
  const langScore = jaccard(
    normalizeArray(submission.languages),
    normalizeArray(referral.preferredLanguages)
  );

  // Capacity
  const capScore = submission.capacityFlag ? 1 : 0;

  // Earliest start: sooner is better – simple bucket
  let startScore = 0;
  if (submission.earliestStartDate) {
    const days = Math.max(
      0,
      Math.round(
        (new Date(submission.earliestStartDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    );
    // Within 7 days → 1; within 14 → 0.6; within 30 → 0.3; else 0.1
    if (days <= 7) startScore = 1;
    else if (days <= 14) startScore = 0.6;
    else if (days <= 30) startScore = 0.3;
    else startScore = 0.1;
  }

  // Quality: cover note length heuristic
  const noteLen = submission.coverNote?.trim().length || 0;
  const qualityScore = Math.max(0, Math.min(1, (noteLen - 300) / 700)); // 300..1000 chars → 0..1

  // Service type – placeholder (caller can award 1 for exact match)
  const serviceTypeScore = 1; // assume match unless overridden upstream

  const score =
    weights.serviceType * serviceTypeScore +
    weights.geo * geoScore +
    weights.credentials * credScore +
    weights.capacity * capScore +
    weights.earliestStart * startScore +
    weights.languages * langScore +
    weights.quality * qualityScore;

  return Math.round(score * 100) / 100; // 2 decimals
}


