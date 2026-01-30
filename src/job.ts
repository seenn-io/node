import type { HttpClient } from './http.js';
import type {
  JobResponse,
  ProgressParams,
  CompleteParams,
  FailParams,
  QueueInfo,
  StageInfo,
  JobResult,
  JobError,
  ParentInfo,
  ChildrenStats,
  ChildProgressMode,
} from './types.js';

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface JobData {
  id: string;
  appId: string;
  userId: string;
  jobType: string;
  title: string;
  workflowId?: string;
  status: JobStatus;
  progress: number;
  message?: string;
  queue?: QueueInfo;
  stage?: StageInfo;
  result?: JobResult;
  error?: JobError;
  metadata?: Record<string, unknown>;
  estimatedCompletionAt?: string;
  etaConfidence?: number;
  etaBasedOn?: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  // Parent-child fields
  parent?: ParentInfo;
  children?: ChildrenStats;
  childProgressMode?: ChildProgressMode;
}

/** Alert push notification options */
export interface AlertPushOptions {
  /** Notification title */
  title: string;
  /** Notification body */
  body: string;
  /** Sound name (default: 'default') */
  sound?: string;
  /** Badge number */
  badge?: number;
}

/** Rich push notification options (TikTok-style) */
export interface RichPushOptions {
  /** Sender name for messaging-style notification */
  senderName: string;
  /** Sender avatar URL for notification image */
  senderAvatar?: string;
  /** Mark as Time Sensitive (iOS 15+) */
  timeSensitive?: boolean;
}

/** Push notification options for job updates */
export interface PushOptions {
  /** Send Live Activity update (default: true) */
  liveActivity?: boolean;
  /** Send silent push for background sync (default: true) */
  silent?: boolean;
  /** Alert push notification */
  alert?: AlertPushOptions;
  /** Rich push notification (TikTok-style) */
  richPush?: RichPushOptions;
}

export interface ProgressOptions {
  message?: string;
  queue?: QueueInfo;
  stage?: StageInfo;
  estimatedCompletionAt?: string;
  metadata?: Record<string, unknown>;
  /** Push notification options */
  push?: PushOptions;
}

/** CTA button configuration for Live Activity completion */
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

export interface CompleteOptions {
  result?: JobResult;
  message?: string;
  /** Live Activity customization (iOS) */
  liveActivity?: LiveActivityOptions;
  /** Push notification options */
  push?: PushOptions;
}

export interface FailOptions {
  error: JobError;
  retryable?: boolean;
  /** Push notification options */
  push?: PushOptions;
}

/**
 * Job instance with fluent API for updates
 */
export class Job implements JobData {
  readonly id: string;
  readonly appId: string;
  readonly userId: string;
  readonly jobType: string;
  readonly title: string;
  readonly workflowId?: string;
  status: JobStatus;
  progress: number;
  message?: string;
  queue?: QueueInfo;
  stage?: StageInfo;
  result?: JobResult;
  error?: JobError;
  metadata?: Record<string, unknown>;
  estimatedCompletionAt?: string;
  etaConfidence?: number;
  etaBasedOn?: number;
  readonly createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  // Parent-child fields
  parent?: ParentInfo;
  children?: ChildrenStats;
  childProgressMode?: ChildProgressMode;

  private readonly http: HttpClient;

  constructor(data: JobResponse, http: HttpClient) {
    this.id = data.id;
    this.appId = data.appId;
    this.userId = data.userId;
    this.jobType = data.jobType;
    this.title = data.title;
    this.workflowId = data.workflowId;
    this.status = data.status;
    this.progress = data.progress;
    this.message = data.message;
    this.queue = data.queue;
    this.stage = data.stage;
    this.result = data.result;
    this.error = data.error;
    this.metadata = data.metadata;
    this.estimatedCompletionAt = data.estimatedCompletionAt;
    this.etaConfidence = data.etaConfidence;
    this.etaBasedOn = data.etaBasedOn;
    this.createdAt = new Date(data.createdAt);
    this.updatedAt = new Date(data.updatedAt);
    this.startedAt = data.startedAt ? new Date(data.startedAt) : undefined;
    this.completedAt = data.completedAt ? new Date(data.completedAt) : undefined;
    // Parent-child fields
    this.parent = data.parent;
    this.children = data.children;
    this.childProgressMode = data.childProgressMode;

    this.http = http;
  }

  /**
   * Update job progress (0-100)
   */
  async setProgress(progress: number, options?: ProgressOptions): Promise<this> {
    const params: ProgressParams = {
      progress,
      ...options,
    };

    const response = await this.http.post<JobResponse>(
      `/jobs/${this.id}/progress`,
      params
    );

    this.updateFromResponse(response);
    return this;
  }

  /**
   * Mark job as completed
   */
  async complete(options?: CompleteOptions): Promise<this> {
    const params: CompleteParams = options || {};

    const response = await this.http.post<JobResponse>(
      `/jobs/${this.id}/complete`,
      params
    );

    this.updateFromResponse(response);
    return this;
  }

  /**
   * Mark job as failed
   */
  async fail(options: FailOptions): Promise<this> {
    const params: FailParams = options;

    const response = await this.http.post<JobResponse>(
      `/jobs/${this.id}/fail`,
      params
    );

    this.updateFromResponse(response);
    return this;
  }

  /**
   * Refresh job data from server
   */
  async refresh(): Promise<this> {
    const response = await this.http.get<JobResponse>(`/jobs/${this.id}`);
    this.updateFromResponse(response);
    return this;
  }

  /**
   * Check if job is in a terminal state
   */
  get isTerminal(): boolean {
    return this.status === 'completed' || this.status === 'failed';
  }

  /**
   * Check if this is a parent job (has children)
   */
  get isParent(): boolean {
    return this.children !== undefined;
  }

  /**
   * Check if this is a child job (has a parent)
   */
  get isChild(): boolean {
    return this.parent !== undefined;
  }

  /**
   * Get child progress summary (only for parent jobs)
   */
  get childProgress(): { completed: number; failed: number; running: number; pending: number; total: number } | null {
    if (!this.children) return null;
    return {
      completed: this.children.completed,
      failed: this.children.failed,
      running: this.children.running,
      pending: this.children.pending,
      total: this.children.total,
    };
  }

  /**
   * Get remaining time until ETA in milliseconds (null if no ETA)
   */
  get etaRemaining(): number | null {
    if (!this.estimatedCompletionAt) return null;
    const eta = new Date(this.estimatedCompletionAt).getTime();
    return Math.max(0, eta - Date.now());
  }

  /**
   * Check if job is past its ETA but still running
   */
  get isPastEta(): boolean {
    if (!this.estimatedCompletionAt || this.isTerminal) return false;
    return new Date(this.estimatedCompletionAt).getTime() < Date.now();
  }

  /**
   * Get plain object representation
   */
  toJSON(): JobData {
    return {
      id: this.id,
      appId: this.appId,
      userId: this.userId,
      jobType: this.jobType,
      title: this.title,
      workflowId: this.workflowId,
      status: this.status,
      progress: this.progress,
      message: this.message,
      queue: this.queue,
      stage: this.stage,
      result: this.result,
      error: this.error,
      metadata: this.metadata,
      estimatedCompletionAt: this.estimatedCompletionAt,
      etaConfidence: this.etaConfidence,
      etaBasedOn: this.etaBasedOn,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      parent: this.parent,
      children: this.children,
      childProgressMode: this.childProgressMode,
    };
  }

  private updateFromResponse(response: JobResponse): void {
    this.status = response.status;
    this.progress = response.progress;
    this.message = response.message;
    this.queue = response.queue;
    this.stage = response.stage;
    this.result = response.result;
    this.error = response.error;
    this.metadata = response.metadata;
    this.estimatedCompletionAt = response.estimatedCompletionAt;
    this.etaConfidence = response.etaConfidence;
    this.etaBasedOn = response.etaBasedOn;
    this.updatedAt = new Date(response.updatedAt);
    this.startedAt = response.startedAt ? new Date(response.startedAt) : undefined;
    this.completedAt = response.completedAt ? new Date(response.completedAt) : undefined;
    this.parent = response.parent;
    this.children = response.children;
    this.childProgressMode = response.childProgressMode;
  }
}
