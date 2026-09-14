import versionJson from './version.json' with { type: 'json' };

export type ReleaseType = 'major' | 'minor' | 'patch';

export type ReleaseIntensity =
  | 'TRIVIAL'
  | 'SMALL'
  | 'NORMAL'
  | 'SUBSTANTIAL'
  | 'VERY_SUBSTANTIAL'
  | 'EXCEPTIONAL';

export interface VersionJump {
  major: number;
  minor: number;
  patch: number;
}

export interface VersionMetadata {
  version: string;
  releaseDate: string;
  releaseType: ReleaseType;
  summary: string;
  releaseIntensity?: ReleaseIntensity;
  versionJump?: VersionJump;
  releaseLabel?: string;
  lastReleaseCommit?: string;
}

interface RawVersionData {
  version: string;
  releaseDate: string;
  releaseType: string;
  summary: string;
  releaseIntensity?: string;
  versionJump?: { major?: number; minor?: number; patch?: number };
  releaseLabel?: string;
  lastReleaseCommit?: string;
}

const versionData = versionJson as unknown as RawVersionData;

export const APP_VERSION: string = versionData.version;
export const CURRENT_VERSION: string = versionData.version;
export const CURRENT_RELEASE_DATE: string = versionData.releaseDate;
export const CURRENT_RELEASE_TYPE: ReleaseType = versionData.releaseType as ReleaseType;
export const CURRENT_RELEASE_SUMMARY: string = versionData.summary;
export const CURRENT_RELEASE_INTENSITY: ReleaseIntensity | undefined =
  versionData.releaseIntensity as ReleaseIntensity | undefined;
export const CURRENT_VERSION_JUMP: VersionJump | undefined =
  versionData.versionJump as VersionJump | undefined;
export const CURRENT_RELEASE_LABEL: string =
  versionData.releaseLabel ||
  (versionData.releaseType.charAt(0).toUpperCase() + versionData.releaseType.slice(1) + ' release');
export const VERSION_METADATA: VersionMetadata = versionData as VersionMetadata;
