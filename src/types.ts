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
}
