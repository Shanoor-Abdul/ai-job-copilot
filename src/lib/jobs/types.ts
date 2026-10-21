export type JobSource = "greenhouse" | "lever" | "company_career" | "other";

export type NormalizedJob = {
  source: JobSource;
  sourceBoard: string;
  externalId: string;
  companyName: string;
  title: string;
  locationText: string | null;
  city: string | null;
  country: string | null;
  workplaceType: string | null;
  description: string | null;
  applyUrl: string;
  publishedAt: string | null;
  sourceUpdatedAt: string | null;
  isActive: boolean;
  contentHash: string;
};

export type JobRecord = {
  id: string;
  source: JobSource;
  source_board: string | null;
  external_id: string;
  company_name: string;
  title: string;
  location_text: string | null;
  city: string | null;
  country: string | null;
  workplace_type: string | null;
  description: string | null;
  apply_url: string;
  published_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
  is_active: boolean;
};
