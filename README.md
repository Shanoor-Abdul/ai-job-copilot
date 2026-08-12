# AI Job Copilot

An AI-powered job search and application copilot that finds relevant opportunities, explains why they match, prepares applications, and helps users apply efficiently.

## Phase 1: Foundation (Completed)

This repository currently contains the Phase 1 implementation of the AI Job Copilot. Phase 1 focuses on setting up the core architecture, database, and authentication foundation.

### Features Implemented
* **Authentication**: Complete Supabase Auth integration for user registration, login, and secure session management via Next.js proxy middleware.
* **Database & ORM**: PostgreSQL database connection via Supabase, managed with Prisma 7 (`@prisma/adapter-pg`).
* **Data Models**: Configured schemas for `User`, `Profile`, and `Resume`.
* **Profile Management**: Fully functional user profile editing with Zod validation and React Hook Form.
* **Resume Upload**: UI foundation for users to upload their resumes to Supabase Storage, storing metadata securely in the database.
* **Dashboard & Landing Pages**: A clean, accessible UI built with `shadcn/ui` components and Tailwind CSS.
* **Security**: Protected routes requiring authentication before users can access the dashboard or profile settings.

### Tech Stack
* **Framework**: Next.js 16 (App Router, Server Actions)
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **Components**: shadcn/ui, Radix UI
* **Forms**: React Hook Form, Zod
* **Database**: PostgreSQL (via Supabase)
* **ORM**: Prisma
* **Authentication**: Supabase Auth
* **Storage**: Supabase Storage

### Setup Instructions (Local Development)

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Copy `.env.example` to `.env` (or `.env.local`) and add your Supabase credentials:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Run `npx prisma db push` and `npx prisma generate` to set up the database.
5. Create a `resumes` bucket in your Supabase Storage.
6. Run `npm run dev` to start the development server.

---
*Future phases will include AI resume parsing, job discovery, AI matching, and browser-based application automation.*
