# @seenn/node

> **Open Source Backend SDK for Job State Transport**

[![npm version](https://badge.fury.io/js/@seenn%2Fnode.svg)](https://www.npmjs.com/package/@seenn/node)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Real-time job progress tracking for AI video generation, image processing, and long-running async tasks.

## Features

- **Fluent API** - Chain job updates naturally
- **Auto-retry** - Exponential backoff with jitter
- **TypeScript** - Full type definitions
- **Self-hosted** - Use with your own backend
- **Open Source** - MIT License

---

## Installation

```bash
npm install @seenn/node
# or
yarn add @seenn/node
# or
pnpm add @seenn/node
```

---

## Quick Start

### Seenn Cloud

```typescript
import { SeennClient } from '@seenn/node';

const seenn = new SeennClient({
  apiKey: 'sk_live_your_api_key',
});
```

### Self-Hosted (Your Own Backend)

```typescript
import { SeennClient } from '@seenn/node';

const seenn = new SeennClient({
  apiKey: 'sk_live_your_api_key',
  baseUrl: 'https://api.yourapp.com', // Your backend URL
});
```

---

## Usage

### Start a Job

```typescript
const job = await seenn.jobs.start({
  jobType: 'video-generation',
  userId: 'user_123',
  title: 'Generating video...',
  metadata: { prompt: 'A cat playing piano' },
  queue: { position: 5, total: 20 },
  stage: { name: 'queued', current: 1, total: 4 },
});

console.log(`Job started: ${job.id}`);
```

### Update Progress

```typescript
await job.setProgress(50, {
  message: 'Rendering frames...',
  stage: { name: 'render', current: 2, total: 4 },
});
```

### Complete Job

```typescript
await job.complete({
  result: {
    type: 'video',
    url: 'https://cdn.example.com/video.mp4',
    data: { duration: 30, resolution: '1080p' },
  },
  message: 'Video ready!',
});
```

### Fail Job

```typescript
await job.fail({
  error: {
    code: 'RENDER_FAILED',
    message: 'GPU memory exceeded',
    details: { gpuMemory: '16GB', required: '24GB' },
  },
  retryable: true,
});
```

### Get / List Jobs

```typescript
// Get single job
const job = await seenn.jobs.get('job_01ABC123');
console.log(job.status, job.progress);

// List user's jobs
const { jobs, nextCursor } = await seenn.jobs.list('user_123', {
  limit: 20,
});
```

---

## Configuration

```typescript
const seenn = new SeennClient({
  apiKey: string;         // Required: sk_live_xxx or sk_test_xxx
  baseUrl?: string;       // Default: https://api.seenn.io
  timeout?: number;       // Default: 30000 (30s)
  maxRetries?: number;    // Default: 3
  debug?: boolean;        // Default: false
});
```

---

## Error Handling

```typescript
import { SeennError, RateLimitError, ValidationError, NotFoundError } from '@seenn/node';

try {
  await seenn.jobs.start({ ... });
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}s`);
  } else if (error instanceof ValidationError) {
    console.log('Invalid input:', error.details);
  } else if (error instanceof NotFoundError) {
    console.log('Job not found');
  } else if (error instanceof SeennError) {
    console.log(`Error ${error.code}: ${error.message}`);
  }
}
```

---

## Self-Hosted Requirements

To use this SDK with your own backend, implement these endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/jobs` | Create a new job |
| GET | `/v1/jobs/:id` | Get job by ID |
| GET | `/v1/jobs?userId=xxx` | List user's jobs |
| POST | `/v1/jobs/:id/progress` | Update job progress |
| POST | `/v1/jobs/:id/complete` | Mark job as completed |
| POST | `/v1/jobs/:id/fail` | Mark job as failed |

See [Self-Hosted Guide](https://docs.seenn.io/self-hosted) for full API specification.

---

## Links

- [Documentation](https://docs.seenn.io)
- [Website](https://seenn.io)
- [GitHub](https://github.com/seenn-io/node)
- [npm](https://www.npmjs.com/package/@seenn/node)

---

## License

MIT © [Seenn](https://seenn.io)
