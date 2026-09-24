# TynocStore

A full-stack e-commerce storefront built as an internship project with
**Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **AWS DynamoDB**,
and **Zod**. It supports a product catalog, search, category filtering, product
detail pages with related products, a persistent cart with stock-aware business
logic, a wishlist, and basic user data management.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Product Catalog & Images](#product-catalog--images)
- [DynamoDB Setup](#dynamodb-setup)
- [Running Locally](#running-locally)
- [Running with Docker](#running-with-docker)
- [Available Scripts](#available-scripts)
- [Git Workflow](#git-workflow)
- [Screenshots](#screenshots)

---

## Features

**Storefront**

- Modern, responsive homepage (mobile / tablet / desktop)
- Product categories and category filtering
- Product listing grid and product detail pages
- Product search (by name and description)
- Product images and information
- Related products on each detail page

**User & data management**

- Users, Products, Categories, Cart, and Wishlist stored in DynamoDB
- Users API (`/api/users`) with create + read and duplicate-email prevention

**Cart & wishlist**

- Add to cart, update quantity, and remove items
- Subtotal calculated on the server (prices never trusted from the client)
- Add/remove wishlist items
- Duplicate prevention (one line per product)
- Stock-aware business logic (can't add more than available stock)

**Application experience**

- Loading states (route-level `loading.tsx` skeletons)
- Empty states (empty cart, wishlist, and no-results search)
- Error handling (global `error.tsx`, per-route `try/catch`)
- Input validation with Zod on every API route
- 404 / not-found handling (global and per product)

**Admin dashboard (`/admin`)**

- Live store totals: users, products, categories, cart items, wishlist items
  (`lib/db/stats.ts`, using `Select: "COUNT"` and projection scans)
- Stock health, recent sign-ups, and recent cart/wishlist activity
- System health panel plus `GET /api/health` (200 healthy, 503 degraded) for monitors
- Product, category, user, and cart/wishlist inspector management pages
- Error boundaries (`app/admin/error.tsx`, `app/global-error.tsx`) and
  empty states with a next step on every admin table

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
AWS DynamoDB  (Users, Products, Categories, Carts, Wishlists)
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
    │   ├── products/[id]/     # Product detail (+ related, loading, not-found)
    │   └── api/               # Route Handlers: cart, wishlist, users
    ├── components/            # Reusable UI + client providers
    ├── lib/
    │   ├── dynamodb.ts        # Shared DynamoDB client
    │   ├── session.ts         # Guest session cookie
    │   ├── db/                # Data Access Layer
    │   └── validations/       # Zod schemas
    ├── scripts/
    │   ├── catalog.json       # Product/category seed data (image URLs, prices)
    │   ├── create-tables.ts   # Create DynamoDB tables (local or AWS)
    │   └── seed.ts            # Load catalog.json into DynamoDB
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
| `USERS_TABLE_NAME`      | No       | Defaults to `Users`                                     |
| `DYNAMODB_ENDPOINT`     | No       | Point at a local DynamoDB; unset = real AWS             |

For local development with DynamoDB Local, set `DYNAMODB_ENDPOINT=http://localhost:8000`
and use dummy values for `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (for example
`local` / `local`).

---

## Product Catalog & Images

Sample products live in **`frontend/scripts/catalog.json`** (categories, names,
prices, stock, and image URLs). The seed script reads that file and writes rows
into DynamoDB; re-running seed replaces the catalog and removes stale rows that
are no longer in the JSON.

**Product photos (important for reviewers)**

- Seeded products store **`imageUrl`** values that point at
  **`https://cdn.dummyjson.com/...`**. That CDN hosts demo product photography
  used for this internship build.
- **`next.config.ts`** whitelists `cdn.dummyjson.com` so `next/image` can optimize
  those remote URLs.
- This is **appropriate for a demo / submission**: you get a realistic storefront
  without hosting image files yourself.
- For a **production** deployment you would typically:
  - Upload assets to **Amazon S3** (or similar),
  - Store stable URLs (or S3 keys) in DynamoDB,
  - Add the bucket hostname to `images.remotePatterns`, and
  - Avoid depending on a third-party CDN you do not control (availability, terms,
    and hotlinking policies).

To change the catalog, edit `catalog.json`, then from `frontend/` run
`npm run db:seed` (with DynamoDB reachable).

---

## DynamoDB Setup

The app uses five tables. Each has a single **partition key `id`** of type
**String** (no sort key).

| Table        | Partition key | Stores                                    |
| ------------ | ------------- | ----------------------------------------- |
| `Users`      | `id` (String) | User records (name, email)                |
| `Products`   | `id` (String) | Product catalog                           |
| `Categories` | `id` (String) | Product categories                        |
| `Carts`      | `id` (String) | One cart per owner (`items[]`)            |
| `Wishlists`  | `id` (String) | One wishlist per owner (`items[]`)        |

A cart or wishlist's `id` is its **owner's id**: the guest session id from the
`tynoc_session` cookie, or a registered user's id. Looking up a user's cart is
therefore a single key read (`GetCommand` with `id = userId`). The admin
inspector (`/admin/inspector`) resolves each row's owner against `Users` and
each `items[].productId` against `Products` (batched with `BatchGetCommand`),
and flags items that point at deleted products.

### How the app reads/creates/updates/deletes data (CRUD)

All database access goes through the Data Access Layer in `lib/db/*.ts`:

- **Read** — `getProducts` / `getProductById` / `getProductsByCategory`,
  `getCategories`, `getCart`, `getWishlist`, `getUsers` / `getUserById`
  (uses `GetCommand` for key lookups and `ScanCommand` for lists).
- **Create / Update** — cart and wishlist writes and `createUser` use
  `PutCommand` (the cart/wishlist store the full `items[]` array per session).
- **Delete** — removing a cart/wishlist item rewrites the item list without the
  removed product (`PutCommand`), keeping one row per session.

### Option A — Real AWS

1. In the AWS Console, create an **IAM user** with programmatic access and
   DynamoDB permissions; copy its keys into `frontend/.env.local`.
2. Create the five tables (partition key `id`, type String), or run:
   ```bash
   cd frontend
   npm run db:create-tables
   ```
3. Seed sample data:
   ```bash
   npm run db:seed
   ```

### Option B — DynamoDB Local (no AWS account)

1. Start DynamoDB Local (from the repo root):
   ```bash
   docker compose up -d dynamodb-local
   ```
2. In `frontend/.env.local`, set `DYNAMODB_ENDPOINT=http://localhost:8000` and
   dummy AWS keys (see [Environment Variables](#environment-variables)).
3. Create tables and seed (from `frontend/`):
   ```bash
   npm run db:create-tables
   npm run db:seed
   npm run dev
   ```

> **Note:** DynamoDB Local runs **in-memory** in this compose file. After a
> container restart, run `db:create-tables` and `db:seed` again.

> **Port 3000:** If another app (for example Grafana) uses port 3000, Next.js
> will pick another port (often **3001**). Use the URL printed in the terminal.

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
| `npm run lint`            | Run ESLint                                      |
| `npm run db:create-tables`  | Create Users/Products/Categories/Carts/Wishlists |
| `npm run db:seed`           | Load `scripts/catalog.json` + sample users      |
| `npm run test:products`     | End-to-end product CRUD test (needs `npm run dev`) |
| `npm run test:categories`   | End-to-end category CRUD test                   |
| `npm run test:users`        | End-to-end user and cart/wishlist inspector test |
| `npm run test:stats`        | Dashboard counts and `/api/health` test         |

Test scripts default to `http://localhost:3000`; pass another URL after `--`,
e.g. `npm run test:stats -- http://localhost:3001`.

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
