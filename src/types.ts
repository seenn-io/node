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
  /** Optional metadata (max 10KB) */
  metadata?: Record<string, unknown>;
  /** Optional initial queue information */
  queue?: QueueInfo;
  /** Optional initial stage information */
  stage?: StageInfo;
  /** Optional estimated completion time (ISO 8601) */
  estimatedCompletionAt?: string;
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
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
  queue?: QueueInfo;
  stage?: StageInfo;
  result?: JobResult;
  error?: JobError;
  metadata?: Record<string, unknown>;
  estimatedCompletionAt?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  /** Parent info (if this is a child job) */
  parent?: ParentInfo;
  /** Children stats (if this is a parent job) */
  children?: ChildrenStats;
  /** Child progress mode (if this is a parent job) */
  childProgressMode?: ChildProgressMode;
}
