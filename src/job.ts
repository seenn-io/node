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
  status: JobStatus;
  progress: number;
  message?: string;
  queue?: QueueInfo;
  stage?: StageInfo;
  result?: JobResult;
  error?: JobError;
  metadata?: Record<string, unknown>;
  estimatedCompletionAt?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  // Parent-child fields
  parent?: ParentInfo;
  children?: ChildrenStats;
  childProgressMode?: ChildProgressMode;
}

export interface ProgressOptions {
  message?: string;
  queue?: QueueInfo;
  stage?: StageInfo;
  estimatedCompletionAt?: string;
  metadata?: Record<string, unknown>;
}

export interface CompleteOptions {
  result?: JobResult;
  message?: string;
}

export interface FailOptions {
  error: JobError;
  retryable?: boolean;
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
  status: JobStatus;
  progress: number;
  message?: string;
  queue?: QueueInfo;
  stage?: StageInfo;
  result?: JobResult;
  error?: JobError;
  metadata?: Record<string, unknown>;
  estimatedCompletionAt?: string;
  readonly createdAt: Date;
  updatedAt: Date;
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
    this.status = data.status;
    this.progress = data.progress;
    this.message = data.message;
    this.queue = data.queue;
    this.stage = data.stage;
    this.result = data.result;
    this.error = data.error;
    this.metadata = data.metadata;
    this.estimatedCompletionAt = data.estimatedCompletionAt;
    this.createdAt = new Date(data.createdAt);
    this.updatedAt = new Date(data.updatedAt);
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
      `/v1/jobs/${this.id}/progress`,
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
      `/v1/jobs/${this.id}/complete`,
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
      `/v1/jobs/${this.id}/fail`,
      params
    );

    this.updateFromResponse(response);
    return this;
  }

  /**
   * Refresh job data from server
   */
  async refresh(): Promise<this> {
    const response = await this.http.get<JobResponse>(`/v1/jobs/${this.id}`);
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
   * Get plain object representation
   */
  toJSON(): JobData {
    return {
      id: this.id,
      appId: this.appId,
      userId: this.userId,
      jobType: this.jobType,
      title: this.title,
      status: this.status,
      progress: this.progress,
      message: this.message,
      queue: this.queue,
      stage: this.stage,
      result: this.result,
      error: this.error,
      metadata: this.metadata,
      estimatedCompletionAt: this.estimatedCompletionAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
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
    this.updatedAt = new Date(response.updatedAt);
    this.completedAt = response.completedAt ? new Date(response.completedAt) : undefined;
    this.parent = response.parent;
    this.children = response.children;
    this.childProgressMode = response.childProgressMode;
  }
}
