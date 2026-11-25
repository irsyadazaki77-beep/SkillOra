import { pool } from "../../db/index.js";

let schemaPromise: Promise<void> | null = null;

/**
 * Idempotently ensures core tables and recently added columns exist in PostgreSQL
 * so environments without a prior `drizzle-kit push` don't fail on SELECT/INSERT.
 */
export async function ensureSchema(): Promise<void> {
  if (schemaPromise) return schemaPromise;
  schemaPromise = runEnsureSchema().catch((err) => {
    schemaPromise = null;
    console.warn("Schema sync warning:", err?.message || err);
  });
  return schemaPromise;
}

async function runEnsureSchema(): Promise<void> {
  const statements = [
    `CREATE TABLE IF NOT EXISTS "companies" (
      "id" serial PRIMARY KEY,
      "name" text NOT NULL,
      "industry" text DEFAULT 'Teknologi & Digital' NOT NULL,
      "logo" text DEFAULT '🏢' NOT NULL,
      "website" text,
      "location" text DEFAULT 'Jakarta, Indonesia' NOT NULL,
      "description" text,
      "verified" boolean DEFAULT false NOT NULL,
      "owner_uid" text NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "users" (
      "id" serial PRIMARY KEY,
      "uid" text NOT NULL UNIQUE,
      "email" text NOT NULL,
      "name" text NOT NULL,
      "level" integer DEFAULT 1 NOT NULL,
      "xp" integer DEFAULT 0 NOT NULL,
      "gems" integer DEFAULT 100 NOT NULL,
      "streak" integer DEFAULT 0 NOT NULL,
      "streak_freezes" integer DEFAULT 0 NOT NULL,
      "last_active" text,
      "role" text DEFAULT 'Pelajar Siap Kerja' NOT NULL,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "account_role" text DEFAULT 'student' NOT NULL;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_tier" text DEFAULT 'free' NOT NULL;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_expires_at" timestamp;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cert_credits" integer DEFAULT 1 NOT NULL;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "company_id" integer;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mentor_specialty" text;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mentor_headline" text;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar" text DEFAULT '🦁';`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" text;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "has_completed_onboarding" boolean DEFAULT false NOT NULL;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_goal" text;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "selected_level_pref" text;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" text;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mentor_tone" text DEFAULT 'friendly' NOT NULL;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notify_email" boolean DEFAULT true NOT NULL;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notify_daily" boolean DEFAULT true NOT NULL;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "notify_sound" boolean DEFAULT true NOT NULL;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "daily_claimed_last" text;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "unlocked_avatars" text;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "purchased_items" text;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "skills" text;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "certified_courses" text;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "career_stage" text DEFAULT 'learning' NOT NULL;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "active_booster_until" timestamp;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "weekly_xp" integer DEFAULT 0 NOT NULL;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "can_repair_streak" boolean DEFAULT false NOT NULL;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lost_streak_count" integer DEFAULT 0 NOT NULL;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "daily_quiz_xp_count" integer DEFAULT 0 NOT NULL;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_quiz_xp_date" text;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "daily_quests" text;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bookmarked_lessons" text;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "portfolio_slug" text;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "portfolio_public" boolean DEFAULT true NOT NULL;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "portfolio_headline" text;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "campus_name" text;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "major_name" text;`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "league_tier" text DEFAULT 'silver' NOT NULL;`,
    `ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'published' NOT NULL;`,
    `ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "is_pro_only" boolean DEFAULT false NOT NULL;`,
    `ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "author_user_id" integer;`,
    `ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "company_id" integer;`,
    `ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "job_type" text DEFAULT 'Full-time' NOT NULL;`,
    `ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active' NOT NULL;`,
    `ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "posted_by_user_id" integer;`,
  ];

  for (const sql of statements) {
    try {
      await pool.query(sql);
    } catch (err: any) {
      // Ignore if table in ALTER doesn't exist yet (e.g., before drizzle-kit push)
      if (err?.code !== "42P01") {
        throw err;
      }
    }
  }
}
