import releaseManifestData from './release-manifest.json' with { type: 'json' };
import { ReleaseType } from './version.js';
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

export interface ReleaseManifest {
  schemaVersion: number;
  version: string;
  releaseTag: string;
  commitSha: string;
  previousVersion: string | null;
  previousCommitSha: string | null;
  releaseType: ReleaseType | 'none';
  releaseDate: string;
  summary: string;
  confidence: ReleaseConfidence;
  manualOverride: boolean;
  commits: CommitRecord[];
  filesChanged: string[];
  categories: CategorizedChanges[];
  breakingChanges?: string[];
  migrationRequired?: boolean;
}

export const RELEASE_MANIFESTS: ReleaseManifest[] = releaseManifestData as unknown as ReleaseManifest[];

export const LATEST_RELEASE_MANIFEST: ReleaseManifest =
  RELEASE_MANIFESTS[0] || {
    schemaVersion: 1,
    version: '1.0.0',
    releaseTag: 'v1.0.0',
    commitSha: '',
    previousVersion: null,
    previousCommitSha: null,
    releaseType: 'major',
    releaseDate: '2026-09-10',
    summary: 'Initial baseline release of MyFinanceOS',
    confidence: { score: 100, level: 'high', signals: ['Baseline release'] },
    manualOverride: false,
    commits: [],
    filesChanged: [],
    categories: []
  };

export function getManifestByVersion(version: string): ReleaseManifest | undefined {
  return RELEASE_MANIFESTS.find((m) => m.version === version);
}

export function getManifestByTag(tag: string): ReleaseManifest | undefined {
  return RELEASE_MANIFESTS.find((m) => m.releaseTag === tag);
}
