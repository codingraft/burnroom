# 🔥 BURNROOM

Self-destructing chat rooms. Messages vanish forever when the timer hits zero.

## Features

- **Ephemeral** - Rooms auto-destruct after 10 minutes
- **Anonymous** - Random usernames, no accounts
- **Real-time** - Instant message delivery
- **Zero persistence** - No logs, no traces

## Setup

```bash
bun install
```

Create `.env`:

```env
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Run

```bash
bun dev
```

## Tech

- Next.js 16
- Upstash Redis
- Upstash Realtime
- Elysia
