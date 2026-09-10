import versionData from './version.json' with { type: 'json' };

export type ReleaseType = 'major' | 'minor' | 'patch';

export interface VersionMetadata {
  version: string;
  releaseDate: string;
  releaseType: ReleaseType;
  summary: string;
  lastReleaseCommit?: string;
}

export const APP_VERSION: string = versionData.version;
export const CURRENT_VERSION: string = versionData.version;
export const CURRENT_RELEASE_DATE: string = versionData.releaseDate;
export const CURRENT_RELEASE_TYPE: ReleaseType = versionData.releaseType as ReleaseType;
export const CURRENT_RELEASE_SUMMARY: string = versionData.summary;
export const VERSION_METADATA: VersionMetadata = versionData as VersionMetadata;
