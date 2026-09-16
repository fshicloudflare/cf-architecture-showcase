# Cloudflare Developer Platform — Reference Architecture

A dark-themed, single-page reference architecture showcase for Cloudflare's Developer Platform, built as a static site served from a Cloudflare Worker.

**Live:** https://cf-architecture-showcase.fionca65318.workers.dev

## What's inside

- **Philosophy** — the V8 isolate execution model, connection management, the inverted regional-architecture default, and the hyperscaler services that don't exist on Cloudflare.
- **Request Flow** — an end-to-end diagram of an inbound request (edge, security, performance, compute, data bindings, origin), plus a detailed "Compute Architecture" diagram showing exactly how Workers fan out to Durable Objects, Containers, Sandbox SDK, Workflows, and dynamically dispatched Workers.
- **Platform Products** — an architecture diagram of storage, AI, and realtime products reachable from a Worker, plus a filterable product catalog. Every node in every diagram links to its Cloudflare docs page.
- **Assessing Fit** — a workload-fit checklist (memory, compute time, user/backend geography, protocols, real-time coordination), plus Containers instance types and account limits.
- **Customer Stories** — tiles summarizing real Cloudflare customers running Workers/edge infrastructure in production, crawled from Cloudflare's case study library.

## Stack

- Cloudflare Workers [Static Assets](https://developers.cloudflare.com/workers/static-assets/) (no server-side code — pure HTML/CSS/JS)
- Plain HTML/CSS/JS, no build step or framework

## Development

```bash
npm install
npx wrangler dev
```

## Deploy

```bash
npx wrangler deploy
```
