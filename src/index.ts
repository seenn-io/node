// @seenn/node - Job State Transport SDK

export { SeennClient } from './client.js';
export type { SeennConfig } from './client.js';

export { Job } from './job.js';
export type { JobStatus, JobData, ProgressOptions, CompleteOptions, FailOptions, LiveActivityCTAButton, LiveActivityOptions } from './job.js';

export type {
  StartJobParams,
  ProgressParams,
  CompleteParams,
  FailParams,
  QueueInfo,
  StageInfo,
  JobResult,
  JobError,
  // Parent-child types
  ChildProgressMode,
  ChildJobSummary,
  ParentInfo,
  ChildrenStats,
  CreateParentParams,
  CreateChildParams,
  CreateBatchParams,
  ParentWithChildren,
  // ETA types
  EtaStats,
  DefaultEtaConfig,
} from './types.js';

export { SeennError, RateLimitError, ValidationError, NotFoundError } from './errors.js';
