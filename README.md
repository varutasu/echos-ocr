# Echo OCR

OCR-powered response card scanner and management tool for Echo Life Church.

Scans front/back of paper response cards (PDF or images), extracts structured data using a local Ollama vision model, stores results in PostgreSQL, and serves them through a modern filterable table UI.

## Stack

- **Next.js 15** (App Router) + **Tailwind CSS v4** + **shadcn/ui**
- **TanStack Table** for data tables with filtering, sorting, pagination
- **Prisma** + **PostgreSQL** for data storage
- **Ollama** (local LLM) for OCR via vision models (LLaVA 7B recommended)
- **MinIO** (S3-compatible) for PDF/image storage
- **Docker** for deployment via Coolify

## Local Development

### Prerequisites

- Node.js 18+
- Docker + Docker Compose (for PostgreSQL + MinIO)
- Ollama running locally with a vision model (`ollama pull llava:7b`)
- GraphicsMagick (`brew install graphicsmagick`) for PDF-to-image conversion

### Setup

```bash
# Install dependencies
npm install

# Start local PostgreSQL + MinIO
docker compose up -d postgres minio

# Create MinIO bucket (visit http://localhost:9001, login minioadmin/minioadmin)

# Push database schema
npm run db:push

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## Deployment (Coolify)

See the deployment section in the project plan for step-by-step Coolify setup instructions including PostgreSQL, MinIO bucket creation, Ollama configuration, and Traefik routing.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cards` | List cards (filters, pagination, search) |
| POST | `/api/cards` | Create a card |
| GET | `/api/cards/[id]` | Get card with presigned image URLs |
| PUT | `/api/cards/[id]` | Update card fields |
| DELETE | `/api/cards/[id]` | Delete card and images |
| POST | `/api/cards/[id]/export` | Mark card as exported |
| POST | `/api/upload` | Upload PDF/images for OCR |
| GET | `/api/jobs` | List processing jobs |
| GET | `/api/stats` | Card count statistics |
| GET/PUT | `/api/settings` | App settings |
| POST | `/api/watch` | Start/stop folder monitoring |
| GET | `/api/images/[...path]` | Proxy images from MinIO |
