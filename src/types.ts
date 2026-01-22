// Child progress calculation mode
export type ChildProgressMode = 'average' | 'weighted' | 'sequential';

// Job Parameters

export interface StartJobParams {
  /** Unique job type identifier (e.g., 'video-generation', 'image-processing') */
  jobType: string;
  /** User ID who owns this job */
  userId: string;
  /** Human-readable title for the job */
  title: string;
  /** Optional version for ETA tracking (e.g., '1.0', '2.1.0') */
  version?: string;
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

export interface CompleteParams {
  /** Result data (max 100KB) */
  result?: JobResult;
  /** Optional completion message */
  message?: string;
}

export interface FailParams {
  /** Error information */
  error: JobError;
  /** Whether the job can be retried */
  retryable?: boolean;
}

// Nested Types

export interface QueueInfo {
  /** Current position in queue (1-based) */
  position: number;
  /** Total items in queue */
  total?: number;
  /** Optional queue name/tier */
  queueName?: string;
}

export interface StageInfo {
  /** Current stage name */
  name: string;
  /** Current stage number (1-based) */
  current: number;
  /** Total number of stages */
  total: number;
  /** Optional stage description */
  description?: string;
}

export interface JobResult {
  /** Result type identifier */
  type?: string;
  /** Result URL (e.g., generated video URL) */
  url?: string;
  /** Additional result data */
  data?: Record<string, unknown>;
}

export interface JobError {
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: Record<string, unknown>;
}

// Parent-child types

/** Summary of a child job */
export interface ChildJobSummary {
  id: string;
  childIndex: number;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
  result?: JobResult;
  error?: JobError;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/** Parent info included in child job responses */
export interface ParentInfo {
  parentJobId: string;
  childIndex: number;
}

/** Children stats included in parent job responses */
export interface ChildrenStats {
  total: number;
  completed: number;
  failed: number;
  running: number;
  pending: number;
}

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

/** Parent job with all its children */
export interface ParentWithChildren {
  parent: JobResponse;
  children: ChildJobSummary[];
}

// API Response Types

export interface JobResponse {
  id: string;
  appId: string;
  userId: string;
  jobType: string;
  title: string;
  /** Job version for ETA tracking */
  version?: string;
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

// ETA Types

/** ETA statistics for a job type */
export interface EtaStats {
  /** Job type identifier */
  jobType: string;
  /** Version (or 'default') */
  version: string;
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

/** Default ETA configuration for job types */
export interface DefaultEtaConfig {
  /** Job type identifier */
  jobType: string;
  /** Default duration in milliseconds (used when no history) */
  defaultDuration: number;
  /** Optional version */
  version?: string;
}
