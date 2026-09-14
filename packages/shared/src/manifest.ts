import releaseManifestData from './release-manifest.json' with { type: 'json' };
import { ReleaseType, ReleaseIntensity, VersionJump } from './version.js';
import { ChangeCategory, CategorizedChanges } from './changelog.js';

export interface ReleaseConfidence {
  score: number;
  level: 'high' | 'medium' | 'low';
  signals: string[];
}

export interface CommitRecord {
  sha: string;
  message: string;
  author?: string;
}

/** Deterministic work-item metrics backing the RMS base points. */
export interface ReleaseScoringMetrics {
  bugFixes: number;
  uiImprovements: number;
  newFeatures: number;
  newWorkflows: number;
  integrations: number;
  commits: number;
}

/** Deterministic scoring block recorded for every SIS/RMS-engine release. */
export interface ReleaseScoring {
  sis: number;
  rms: number;
  intensity: ReleaseIntensity;
  productAreasAffected: string[];
  metrics: ReleaseScoringMetrics;
}

/** Human-facing changelog block stored in the manifest. */
export interface ReleaseChangelogBlock {
  summary: string;
  categories: Record<string, string[]>;
}

export interface ReleaseManifest {
  /** Nestable document schema (releases created after the SIS/RMS engine). */
  schemaVersion?: number;
  version: string;
  previousVersion?: string | null;
  /** Task-schema tag ("vX.Y.Z"); legacy records use releaseTag. */
  tag?: string;
  releaseTag?: string;
  timestamp?: string;
  semverType?: 'MAJOR' | 'MINOR' | 'PATCH' | 'NONE';
  minorJump?: number;
  scoring?: ReleaseScoring;
  changelog?: ReleaseChangelogBlock;
  releaseLabel?: string;
  // Legacy audit fields (preserved on pre-SIS/RMS records)
  commitSha?: string;
  previousCommitSha?: string | null;
  releaseType?: ReleaseType | 'none';
  releaseIntensity?: ReleaseIntensity;
  intensityScore?: number;
  versionJump?: VersionJump;
  evidence?: string[];
  releaseDate?: string;
  summary?: string;
  confidence?: ReleaseConfidence;
  manualOverride?: boolean;
  commits?: CommitRecord[];
  filesChanged?: string[];
  categories?: CategorizedChanges[];
  breakingChanges?: string[];
  migrationRequired?: boolean;
}

interface RawManifestDocument {
  schemaVersion: number;
  releases: ReleaseManifest[];
}

const manifestDocument = releaseManifestData as unknown as RawManifestDocument | ReleaseManifest[];

/**
 * Release records, newest first. Supports both the nested document schema
 * ({ schemaVersion, releases }) and the legacy flat array.
 */
export const RELEASE_MANIFESTS: ReleaseManifest[] = Array.isArray(manifestDocument)
  ? manifestDocument
  : manifestDocument.releases;

export const MANIFEST_SCHEMA_VERSION: number = Array.isArray(manifestDocument)
  ? 1
  : manifestDocument.schemaVersion;

/**
 * Releases created before the SIS/RMS scoring engine carry no scoring
 * block; treat those as legacy entries.
 */
export function isLegacyManifest(manifest: ReleaseManifest): boolean {
  return manifest.scoring === undefined;
}

export const LATEST_RELEASE_MANIFEST: ReleaseManifest =
  RELEASE_MANIFESTS[0] || {
    schemaVersion: 1,
    version: '1.0.0',
    tag: 'v1.0.0',
    releaseTag: 'v1.0.0',
    semverType: 'MAJOR',
    minorJump: 0,
    scoring: {
      sis: 0,
      rms: 0,
      intensity: 'NORMAL',
      productAreasAffected: [],
      metrics: { bugFixes: 0, uiImprovements: 0, newFeatures: 0, newWorkflows: 0, integrations: 0, commits: 0 }
    },
    changelog: { summary: 'Initial baseline release of MyFinanceOS', categories: {} }
  };

export function getManifestByVersion(version: string): ReleaseManifest | undefined {
  return RELEASE_MANIFESTS.find((m) => m.version === version);
}

export function getManifestByTag(tag: string): ReleaseManifest | undefined {
  return RELEASE_MANIFESTS.find((m) => m.tag === tag || m.releaseTag === tag);
}
