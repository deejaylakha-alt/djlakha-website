# DJ LAKHA SEO Agents — Quick Start Guide

## Prerequisites
1. Install Node.js: `brew install node`
2. Install dependencies: `cd seo-agents && npm install`

## Available Agents

### Run Everything at Once
```bash
cd "DJ LAKHA /seo-agents" && npm run run-all
```

### Run Individual Agents

| Command | What It Does |
|---|---|
| `npm run audit` | Scans all HTML pages for SEO issues (titles, meta, schema, alt text, etc.) |
| `npm run optimize-images` | Converts all images to WebP format with responsive sizes |
| `npm run monitor-competitors` | Checks Karma DJs, DJ Tej, etc. for SEO changes |
| `npm run track-rankings` | Checks your Google ranking for target keywords |
| `npm run generate-blog` | Creates SEO-optimized blog post templates |
| `npm run review-outreach` | Generates review request emails/texts for past clients |
| `npm run build-citations` | Creates directory listing guide with pre-written profiles |

## Where Are Results?

| Folder | Contents |
|---|---|
| `seo-agents/reports/` | Audit reports, ranking reports, competitor reports |
| `seo-agents/output/optimized-images/` | WebP images ready to deploy |
| `seo-agents/output/blog-posts/` | Blog post HTML templates |
| `seo-agents/output/outreach/` | Review request messages + tracker |
| `seo-agents/output/citations/` | Directory listing guide |

## Recommended Schedule

| Frequency | Action |
|---|---|
| **Weekly** | `npm run audit` — catch any regressions |
| **Weekly** | `npm run monitor-competitors` — watch their moves |
| **Monthly** | `npm run track-rankings` — track progress |
| **Once** | `npm run optimize-images` — after adding new photos |
| **Once** | `npm run generate-blog` — when ready to write content |
| **Once** | `npm run review-outreach` — after adding client list |
| **Once** | `npm run build-citations` — when starting directory listings |

## Customization

### Add Past Clients (for review outreach)
Edit `seo-agents/agents/review-outreach.js` and add clients to the `CLIENTS` array:
```js
{ name: 'Bride & Groom', event: 'wedding reception', city: 'Austin', date: 'March 2025', type: 'Punjabi wedding' },
```

### Add Competitors to Monitor
Edit `seo-agents/agents/competitor-monitor.js` and add URLs to the `COMPETITORS` array.

### Change Target Keywords
Edit `seo-agents/agents/rank-tracker.js` and modify the `KEYWORDS` array.
