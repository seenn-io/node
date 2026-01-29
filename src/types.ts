/**
 * Seenn Node.js SDK Types
 *
 * Re-exports from @seenn/types (single source of truth)
 * Plus Node.js SDK specific types
 *
 * @see https://www.npmjs.com/package/@seenn/types
 */

// Re-export shared types from @seenn/types
export type {
  // Core Types
  JobStatus,
  ChildProgressMode,
  StageInfo,
  QueueInfo,
  JobResult,
  JobError,

  // Parent-Child Types
  ParentInfo,
  ChildrenStats,
  ChildJobSummary,

  // ETA Types (basic)
  EtaStats,

  // Live Activity Types
  LiveActivityCTAButton as LiveActivityCTAButtonType,
} from '@seenn/types';

// ============================================
// Node.js SDK Specific Types
// ============================================

import type { StageInfo, QueueInfo, JobResult, JobError, ChildProgressMode, ParentInfo, ChildrenStats } from '@seenn/types';

// Job Parameters (server-side)

export interface StartJobParams {
  /** Unique job type identifier (e.g., 'video-generation', 'image-processing') */
  jobType: string;
  /** User ID who owns this job */
  userId: string;
  /** Human-readable title for the job */
  title: string;
  /** Workflow ID for ETA tracking (default: jobType) */
  workflowId?: string;
  /** Optional metadata (max 10KB) */
  metadata?: Record<string, unknown>;
  /** Optional initial queue information */
  queue?: QueueInfo;
  /** Optional initial stage information */
  stage?: StageInfo;
  /** Optional estimated completion time (ISO 8601) - overrides auto ETA */
  estimatedCompletionAt?: string;
  /** Optional estimated duration in ms - overrides auto ETA */
  estimatedDuration?: number;
  /** Optional TTL in seconds (default: 30 days) */
  ttlSeconds?: number;
  /** Parent job ID (for child jobs) */
  parentJobId?: string;
  /** 0-based index within parent (for child jobs) */
  childIndex?: number;
  /** Total number of children (for parent jobs) */
  totalChildren?: number;
  /** How to calculate parent progress from children (default: 'average') */
  childProgressMode?: ChildProgressMode;
}

export interface ProgressParams {
  /** Progress percentage (0-100) */
  progress: number;
  /** Optional status message */
  message?: string;
  /** Optional updated queue information */
  queue?: QueueInfo;
  /** Optional updated stage information */
  stage?: StageInfo;
  /** Optional updated ETA */
  estimatedCompletionAt?: string;
  /** Optional metadata update (merged with existing) */
  metadata?: Record<string, unknown>;
}

/** CTA button for Live Activity completion */
export interface LiveActivityCTAButton {
  /** Button text */
  text: string;
  /** Deep link URL to open when tapped */
  deepLink: string;
  /** Button style preset */
  style?: 'primary' | 'secondary' | 'outline';
  /** Custom background color (hex) */
  backgroundColor?: string;
  /** Custom text color (hex) */
  textColor?: string;
}

/** Live Activity options for job completion */
export interface LiveActivityOptions {
  /** CTA button to show on completion */
  ctaButton?: LiveActivityCTAButton;
}

export interface CompleteParams {
  /** Result data (max 100KB) */
  result?: JobResult;
  /** Optional completion message */
  message?: string;
  /** Live Activity customization (iOS) */
  liveActivity?: LiveActivityOptions;
}

export interface FailParams {
  /** Error information */
  error: JobError;
  /** Whether the job can be retried */
  retryable?: boolean;
}

// Parent-child specific types (server-side)

/** Parameters for creating a parent job */
export interface CreateParentParams {
  /** Unique job type identifier */
  jobType: string;
  /** User ID who owns this job */
  userId: string;
  /** Human-readable title for the parent job */
  title: string;
  /** Total number of children this parent will have */
  childCount: number;
  /** How to calculate parent progress from children (default: 'average') */
  childProgressMode?: ChildProgressMode;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
  /** Optional TTL in seconds */
  ttlSeconds?: number;
}

/** Parameters for creating a child job */
export interface CreateChildParams {
  /** Parent job ID */
  parentJobId: string;
  /** 0-based index within parent */
  childIndex: number;
  /** Unique job type identifier */
  jobType: string;
  /** User ID who owns this job */
  userId: string;
  /** Human-readable title for the child job */
  title: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
  /** Optional TTL in seconds */
  ttlSeconds?: number;
}

/** Parameters for creating a batch of jobs */
export interface CreateBatchParams {
  /** Unique job type identifier for all jobs */
  jobType: string;
  /** User ID who owns these jobs */
  userId: string;
  /** Human-readable title for the parent job */
  parentTitle: string;
  /** Titles for each child job */
  childTitles: string[];
  /** How to calculate parent progress from children (default: 'average') */
  childProgressMode?: ChildProgressMode;
  /** Optional metadata for parent job */
  metadata?: Record<string, unknown>;
  /** Optional TTL in seconds */
  ttlSeconds?: number;
}

// API Response Types (server-side format)

export interface JobResponse {
  id: string;
  appId: string;
  userId: string;
  jobType: string;
  title: string;
  /** Workflow ID for ETA tracking (default: jobType) */
  workflowId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
  queue?: QueueInfo;
  stage?: StageInfo;
  result?: JobResult;
  error?: JobError;
  metadata?: Record<string, unknown>;
  /** Estimated completion time (ISO 8601) */
  estimatedCompletionAt?: string;
  /** ETA confidence score (0.0 - 1.0) */
  etaConfidence?: number;
  /** Number of historical jobs used to calculate ETA */
  etaBasedOn?: number;
  createdAt: string;
  updatedAt: string;
  /** When the job actually started running */
  startedAt?: string;
  completedAt?: string;
  /** Parent info (if this is a child job) */
  parent?: ParentInfo;
  /** Children stats (if this is a parent job) */
  children?: ChildrenStats;
  /** Child progress mode (if this is a parent job) */
  childProgressMode?: ChildProgressMode;
}

/** Parent job with all its children (server response) */
export interface ParentWithChildren {
  parent: JobResponse;
  children: import('@seenn/types').ChildJobSummary[];
}

// ETA Types (server-side extended)

/** Extended ETA statistics for a workflow */
export interface EtaStatsExtended {
  /** ETA key (workflowId or jobType) */
  etaKey: string;
  /** Number of completed jobs in statistics */
  count: number;
  /** Average duration in milliseconds */
  avgDuration: number;
  /** Median duration (50th percentile) in milliseconds */
  p50Duration: number;
  /** 95th percentile duration in milliseconds */
  p95Duration: number;
  /** Minimum recorded duration */
  minDuration: number;
  /** Maximum recorded duration */
  maxDuration: number;
  /** Confidence score for ETA predictions (0.0 - 1.0) */
  confidence: number;
  /** Last time stats were updated */
  lastUpdated: string;
}

/** Default ETA configuration */
export interface DefaultEtaConfig {
  /** ETA key (workflowId or jobType) */
  etaKey: string;
  /** Default duration in milliseconds (used when no history) */
  defaultDuration: number;
}
