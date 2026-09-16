# TynocStore

A full-stack e-commerce storefront built as an internship project with
**Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **AWS DynamoDB**,
and **Zod**. It supports a product catalog, category filtering, product detail
pages, a persistent cart, and a wishlist.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [DynamoDB Setup](#dynamodb-setup)
- [Running Locally](#running-locally)
- [Running with Docker](#running-with-docker)
- [Available Scripts](#available-scripts)
- [Git Workflow](#git-workflow)
- [Screenshots](#screenshots)

---

## Tech Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Framework  | Next.js 16 (App Router)             |
| Language   | TypeScript                          |
| Styling    | Tailwind CSS v4                     |
| Database   | AWS DynamoDB                        |
| Validation | Zod                                 |
| Runtime    | Node.js 22                          |

---

## Architecture Overview

The app follows a layered architecture so the UI never talks to the database
directly. Each layer has one job:

```
Browser (React Client Components)
      │  fetch()
      ▼
Route Handlers  (app/api/**/route.ts)   ← validate input with Zod
      │
      ▼
Data Access Layer  (lib/db/*.ts)        ← the only code that queries DynamoDB
      │
      ▼
DynamoDB Client  (lib/dynamodb.ts)      ← one shared client (singleton)
      │
      ▼
AWS DynamoDB  (Products, Categories, Carts, Wishlists)
```

**Why it's structured this way**

- **Separation of concerns** — change a table name or add caching in one place
  (the DAL) without touching the UI.
- **Security** — prices and totals are always recomputed from the database, so
  a client can't tamper with them. Secrets stay server-side only.
- **Type safety** — shared interfaces in `types/index.ts` describe the data
  everywhere (seed script, DAL, UI).

**Rendering model**

- Pages that read data (`/`, `/products/[id]`) are **Server Components** and are
  server-rendered on demand.
- Interactive pieces (cart drawer, buttons, `/cart`, `/wishlist`) are
  **Client Components** that use React context (`CartProvider`,
  `WishlistProvider`).

---

## Project Structure

```
tynoctech_project/
├── docker-compose.yml         # Local stack: app + DynamoDB Local
├── README.md
└── frontend/                  # Next.js application
    ├── Dockerfile             # Multi-stage production image
    ├── .dockerignore
    ├── .env.example           # Template for environment variables
    ├── next.config.ts         # standalone output + image domains
    ├── app/                   # Routes (App Router)
    │   ├── layout.tsx         # Root layout (Header/Footer + providers)
    │   ├── page.tsx           # Homepage (catalog + category filter)
    │   ├── error.tsx          # Global error boundary
    │   ├── not-found.tsx      # Global 404
    │   ├── loading.tsx        # Homepage skeleton
    │   ├── cart/page.tsx      # Full cart page
    │   ├── wishlist/page.tsx  # Wishlist page
    │   ├── products/[id]/     # Product detail (+ loading, not-found)
    │   └── api/               # Route Handlers: products, cart, wishlist
    ├── components/            # Reusable UI + client providers
    ├── lib/
    │   ├── dynamodb.ts        # Shared DynamoDB client
    │   ├── session.ts         # Guest session cookie
    │   ├── db/                # Data Access Layer
    │   └── validations/       # Zod schemas
    ├── scripts/seed.ts        # Seed sample products/categories
    └── types/index.ts         # Shared TypeScript interfaces
```

---

## Environment Variables

Create `frontend/.env.local` (copy from `frontend/.env.example`). This file is
git-ignored and must never be committed.

| Variable                | Required | Description                                             |
| ----------------------- | -------- | ------------------------------------------------------- |
| `AWS_ACCESS_KEY_ID`     | Yes      | IAM access key (any dummy value for DynamoDB Local)     |
| `AWS_SECRET_ACCESS_KEY` | Yes      | IAM secret key (any dummy value for DynamoDB Local)     |
| `AWS_REGION`            | Yes      | e.g. `us-east-1`                                        |
| `PRODUCTS_TABLE_NAME`   | No       | Defaults to `Products`                                  |
| `CATEGORIES_TABLE_NAME` | No       | Defaults to `Categories`                                |
| `CARTS_TABLE_NAME`      | No       | Defaults to `Carts`                                     |
| `WISHLISTS_TABLE_NAME`  | No       | Defaults to `Wishlists`                                 |
| `DYNAMODB_ENDPOINT`     | No       | Point at a local DynamoDB; unset = real AWS             |

---

## DynamoDB Setup

The app uses four tables. Each has a single **partition key `id`** of type
**String** (no sort key).

| Table        | Partition key | Stores                                    |
| ------------ | ------------- | ----------------------------------------- |
| `Products`   | `id` (String) | Product catalog                           |
| `Categories` | `id` (String) | Product categories                        |
| `Carts`      | `id` (String) | One cart per guest session (`items[]`)    |
| `Wishlists`  | `id` (String) | One wishlist per guest session (`items[]`)|

### Option A — Real AWS

1. In the AWS Console, create an **IAM user** with programmatic access and
   DynamoDB permissions; copy its keys into `frontend/.env.local`.
2. Create the four tables above (partition key `id`, type String).
3. Seed sample data:
   ```bash
   cd frontend
   npm run db:seed
   ```

### Option B — DynamoDB Local (no AWS account)

Use Docker (see below). DynamoDB Local accepts any dummy credentials. You still
need to create the tables inside it (e.g. via the AWS CLI pointed at
`http://localhost:8000`) before seeding.

---

## Running Locally

Requirements: Node.js 22+.

```bash
cd frontend
npm install
cp .env.example .env.local   # then edit values
npm run dev
```

Open http://localhost:3000.

> Without valid AWS credentials/tables, the UI still loads but product/cart data
> will be empty and show a friendly message.

---

## Running with Docker

From the repository root:

```bash
docker compose up --build
```

This starts:

- **dynamodb-local** on `http://localhost:8000`
- **web** (the Next.js app) on `http://localhost:3000`

The web container automatically sets `DYNAMODB_ENDPOINT` to reach the local
database. It reads other variables from `frontend/.env.local`.

To build just the app image:

```bash
cd frontend
docker build -t tynocstore .
docker run -p 3000:3000 --env-file .env.local tynocstore
```

---

## Available Scripts

Run inside `frontend/`:

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the dev server                 |
| `npm run build`   | Production build                     |
| `npm run start`   | Run the production build             |
| `npm run lint`    | Run ESLint                           |
| `npm run db:seed` | Insert sample products & categories  |

---

## Git Workflow

This project follows a feature-branch workflow with
[Conventional Commits](https://www.conventionalcommits.org/):

```bash
git checkout main
git pull origin main
git checkout -b feature/my-change
# ... work ...
git commit -m "feat: add cart drawer"
git push -u origin feature/my-change
# open a Pull Request, then merge into main
```

Commit prefixes used: `feat:`, `fix:`, `chore:`, `docs:`.

---

## Screenshots

> Replace the placeholders below with real screenshots (drop images in
> `docs/screenshots/` and update the paths).

| Home / Catalog | Product Detail |
| -------------- | -------------- |
| _add screenshot_ | _add screenshot_ |

| Cart Drawer | Wishlist |
| ----------- | -------- |
| _add screenshot_ | _add screenshot_ |
