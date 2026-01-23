import { Job } from './job.js';
import { HttpClient } from './http.js';
import type {
  StartJobParams,
  JobResponse,
  CreateParentParams,
  CreateChildParams,
  CreateBatchParams,
  ParentWithChildren,
  ChildJobSummary,
  EtaStats,
} from './types.js';

export interface SeennConfig {
  /** API key (sk_live_xxx or sk_test_xxx) */
  apiKey: string;
  /** Base URL (default: https://api.seenn.io) */
  baseUrl?: string;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Max retry attempts (default: 3) */
  maxRetries?: number;
  /** Enable debug logging */
  debug?: boolean;
}

export class SeennClient {
  private readonly http: HttpClient;
  private readonly config: Required<SeennConfig>;

  constructor(config: SeennConfig) {
    if (!config.apiKey) {
      throw new Error('apiKey is required');
    }

    if (!config.apiKey.startsWith('sk_')) {
      throw new Error('apiKey must start with sk_live_ or sk_test_');
    }

    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api.seenn.io',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      debug: config.debug || false,
    };

    this.http = new HttpClient(this.config);
  }

  /**
   * Jobs resource
   */
  get jobs() {
    return {
      /**
       * Start a new job
       */
      start: async (params: StartJobParams): Promise<Job> => {
        const response = await this.http.post<JobResponse>('/v1/jobs', params);
        return new Job(response, this.http);
      },

      /**
       * Get a job by ID
       */
      get: async (jobId: string): Promise<Job> => {
        const response = await this.http.get<JobResponse>(`/v1/jobs/${jobId}`);
        return new Job(response, this.http);
      },

      /**
       * List jobs for a user
       */
      list: async (userId: string, options?: { limit?: number; cursor?: string }) => {
        const params = new URLSearchParams({ userId });
        if (options?.limit) params.set('limit', String(options.limit));
        if (options?.cursor) params.set('cursor', options.cursor);

        const response = await this.http.get<{
          jobs: JobResponse[];
          nextCursor?: string;
        }>(`/v1/jobs?${params}`);

        return {
          jobs: response.jobs.map((j) => new Job(j, this.http)),
          nextCursor: response.nextCursor,
        };
      },

      /**
       * Create a parent job (batch container)
       */
      createParent: async (params: CreateParentParams): Promise<Job> => {
        const response = await this.http.post<JobResponse>('/v1/jobs', {
          jobType: params.jobType,
          userId: params.userId,
          title: params.title,
          totalChildren: params.childCount,
          childProgressMode: params.childProgressMode,
          metadata: params.metadata,
          ttlSeconds: params.ttlSeconds,
        });
        return new Job(response, this.http);
      },

      /**
       * Create a child job under a parent
       */
      createChild: async (params: CreateChildParams): Promise<Job> => {
        const response = await this.http.post<JobResponse>('/v1/jobs', {
          jobType: params.jobType,
          userId: params.userId,
          title: params.title,
          parentJobId: params.parentJobId,
          childIndex: params.childIndex,
          metadata: params.metadata,
          ttlSeconds: params.ttlSeconds,
        });
        return new Job(response, this.http);
      },

      /**
       * Get a parent job with all its children
       */
      getWithChildren: async (parentJobId: string): Promise<{ parent: Job; children: ChildJobSummary[] }> => {
        const response = await this.http.get<ParentWithChildren>(
          `/v1/jobs/${parentJobId}/children`
        );
        return {
          parent: new Job(response.parent, this.http),
          children: response.children,
        };
      },

      /**
       * Create a batch of jobs (parent + children) in one go
       * Returns the parent job and all child jobs
       */
      createBatch: async (params: CreateBatchParams): Promise<{ parent: Job; children: Job[] }> => {
        // Create parent job first
        const parent = await this.jobs.createParent({
          jobType: params.jobType,
          userId: params.userId,
          title: params.parentTitle,
          childCount: params.childTitles.length,
          childProgressMode: params.childProgressMode,
          metadata: params.metadata,
          ttlSeconds: params.ttlSeconds,
        });

        // Create all children in parallel
        const childPromises = params.childTitles.map((title, index) =>
          this.jobs.createChild({
            parentJobId: parent.id,
            childIndex: index,
            jobType: params.jobType,
            userId: params.userId,
            title,
            ttlSeconds: params.ttlSeconds,
          })
        );

        const children = await Promise.all(childPromises);

        // Refresh parent to get updated counters
        await parent.refresh();

        return { parent, children };
      },
    };
  }

  /**
   * ETA (Estimated Time of Arrival) resource
   */
  get eta() {
    return {
      /**
       * Get ETA statistics for a specific etaKey (workflowId or jobType)
       */
      getStats: async (etaKey: string): Promise<EtaStats | null> => {
        try {
          const response = await this.http.get<EtaStats>(`/v1/eta/${encodeURIComponent(etaKey)}`);
          return response;
        } catch (error: unknown) {
          // Return null if no stats exist yet
          if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
            return null;
          }
          throw error;
        }
      },

      /**
       * List all ETA statistics for the app
       */
      list: async (): Promise<EtaStats[]> => {
        const response = await this.http.get<{ stats: EtaStats[] }>('/v1/eta');
        return response.stats;
      },

      /**
       * Reset ETA statistics for a specific etaKey (admin use)
       */
      reset: async (etaKey: string): Promise<void> => {
        await this.http.delete(`/v1/eta/${encodeURIComponent(etaKey)}`);
      },
    };
  }
}
