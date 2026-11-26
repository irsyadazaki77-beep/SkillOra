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
  try {
    const checkRes = await pool.query(`
      SELECT
        (SELECT count(*)::int FROM information_schema.tables
         WHERE table_schema = 'public'
           AND table_name IN (
             'learning_paths', 'learning_path_courses', 'course_enrollments', 'peer_reviews',
             'course_exams', 'flashcard_progress', 'training_assignments', 'simulation_attempts'
           )) AS table_cnt,
        (SELECT count(*)::int FROM information_schema.columns
         WHERE table_schema = 'public'
           AND (
             (table_name = 'users' AND column_name = 'portfolio_slug') OR
             (table_name = 'courses' AND column_name = 'linked_lab_ids') OR
             (table_name = 'lessons' AND column_name = 'flashcards')
           )) AS col_cnt
    `);
    const row = checkRes.rows?.[0];
    if (Number(row?.table_cnt) >= 8 && Number(row?.col_cnt) >= 3) {
      return;
    }
  } catch {
    // Proceed to fallback DDL statements if metadata query fails
  }

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
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "weekly_target_days" integer DEFAULT 5 NOT NULL;`,
    `ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "certificate_type" text DEFAULT 'course' NOT NULL;`,
    `ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "path_slug" text;`,
    `ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'published' NOT NULL;`,
    `ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "is_pro_only" boolean DEFAULT false NOT NULL;`,
    `ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "author_user_id" integer;`,
    `ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "linked_lab_ids" jsonb DEFAULT '[]' NOT NULL;`,
    `ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "case_prompt" jsonb;`,
    `ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "content_markdown" text;`,
    `ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "video_url" text;`,
    `ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "estimated_minutes" integer DEFAULT 15 NOT NULL;`,
    `ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "questions_data" jsonb;`,
    `ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "inline_checks" jsonb DEFAULT '[]' NOT NULL;`,
    `ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "flashcards" jsonb DEFAULT '[]' NOT NULL;`,
    `ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "company_id" integer;`,
    `ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "job_type" text DEFAULT 'Full-time' NOT NULL;`,
    `ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active' NOT NULL;`,
    `ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "posted_by_user_id" integer;`,
    `CREATE TABLE IF NOT EXISTS "lab_challenges" (
      "id" serial PRIMARY KEY,
      "challenge_id" text NOT NULL UNIQUE,
      "title" text NOT NULL,
      "track" text NOT NULL,
      "difficulty" text DEFAULT 'Menengah' NOT NULL,
      "estimated_minutes" integer DEFAULT 25 NOT NULL,
      "language" text DEFAULT 'javascript' NOT NULL,
      "summary" text NOT NULL,
      "prompt_markdown" text NOT NULL,
      "starter_code" text NOT NULL,
      "hints" jsonb DEFAULT '[]' NOT NULL,
      "test_cases" jsonb DEFAULT '[]' NOT NULL,
      "rubric_criteria" jsonb DEFAULT '[]' NOT NULL,
      "skills" jsonb DEFAULT '[]' NOT NULL,
      "xp_reward" integer DEFAULT 180 NOT NULL,
      "gems_reward" integer DEFAULT 25 NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "lab_submissions" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL,
      "challenge_id" text NOT NULL,
      "code_or_answer" text NOT NULL,
      "test_passed_count" integer DEFAULT 0 NOT NULL,
      "test_total_count" integer DEFAULT 0 NOT NULL,
      "score" integer DEFAULT 0 NOT NULL,
      "rubric_scores" jsonb DEFAULT '[]' NOT NULL,
      "ai_feedback" text NOT NULL,
      "strengths" jsonb DEFAULT '[]' NOT NULL,
      "improvements" jsonb DEFAULT '[]' NOT NULL,
      "refactored_snippet" text,
      "passed" boolean DEFAULT false NOT NULL,
      "earned_xp" integer DEFAULT 0 NOT NULL,
      "earned_gems" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "lesson_notes" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL,
      "course_id" text NOT NULL,
      "lesson_id" text NOT NULL,
      "content" text DEFAULT '' NOT NULL,
      "is_pinned" boolean DEFAULT false NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "lesson_notes_user_course_lesson_uniq" UNIQUE ("user_id", "course_id", "lesson_id")
    );`,
    `CREATE TABLE IF NOT EXISTS "study_roadmaps" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL,
      "target_role" text NOT NULL,
      "hours_per_week" integer DEFAULT 8 NOT NULL,
      "summary" text NOT NULL,
      "weeks" jsonb DEFAULT '[]' NOT NULL,
      "progress_percent" integer DEFAULT 0 NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "arena_matches" (
      "id" serial PRIMARY KEY,
      "room_code" text NOT NULL,
      "topic" text NOT NULL,
      "mode" text DEFAULT 'battle' NOT NULL,
      "status" text DEFAULT 'finished' NOT NULL,
      "host_user_id" integer,
      "participants" jsonb DEFAULT '[]' NOT NULL,
      "winner_name" text,
      "question_count" integer DEFAULT 5 NOT NULL,
      "created_at" timestamp DEFAULT now(),
      "finished_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "tryout_attempts" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL,
      "tryout_id" text NOT NULL,
      "title" text NOT NULL,
      "category" text NOT NULL,
      "score" integer DEFAULT 0 NOT NULL,
      "max_score" integer DEFAULT 100 NOT NULL,
      "correct_count" integer DEFAULT 0 NOT NULL,
      "total_questions" integer DEFAULT 10 NOT NULL,
      "subtest_scores" jsonb DEFAULT '[]' NOT NULL,
      "duration_seconds" integer DEFAULT 0 NOT NULL,
      "percentile" integer DEFAULT 50 NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "campus_cohorts" (
      "id" serial PRIMARY KEY,
      "cohort_id" text NOT NULL UNIQUE,
      "campus_name" text NOT NULL,
      "city" text NOT NULL,
      "program_title" text NOT NULL,
      "target_role" text NOT NULL,
      "active_students" integer DEFAULT 120 NOT NULL,
      "avg_readiness" integer DEFAULT 78 NOT NULL,
      "certified_count" integer DEFAULT 45 NOT NULL,
      "featured_labs" jsonb DEFAULT '[]' NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "course_exams" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL,
      "course_id" text NOT NULL,
      "exam_type" text NOT NULL,
      "score" integer DEFAULT 0 NOT NULL,
      "passed" boolean DEFAULT false NOT NULL,
      "correct_count" integer DEFAULT 0 NOT NULL,
      "total_questions" integer DEFAULT 0 NOT NULL,
      "competency_breakdown" jsonb DEFAULT '[]' NOT NULL,
      "weak_topics" jsonb DEFAULT '[]' NOT NULL,
      "ai_diagnostic" text,
      "duration_seconds" integer DEFAULT 0 NOT NULL,
      "earned_xp" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "flashcard_progress" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL,
      "course_id" text NOT NULL,
      "lesson_id" text NOT NULL,
      "card_id" text NOT NULL,
      "ease_factor" integer DEFAULT 250 NOT NULL,
      "interval_days" integer DEFAULT 1 NOT NULL,
      "repetitions" integer DEFAULT 0 NOT NULL,
      "last_quality" text DEFAULT 'good' NOT NULL,
      "next_review_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "flashcard_progress_user_course_card_uniq" UNIQUE ("user_id", "course_id", "card_id")
    );`,
    `CREATE TABLE IF NOT EXISTS "training_assignments" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL,
      "course_id" text NOT NULL,
      "prompt_title" text NOT NULL,
      "answer_text" text NOT NULL,
      "score" integer DEFAULT 0 NOT NULL,
      "passed" boolean DEFAULT false NOT NULL,
      "rubric_scores" jsonb DEFAULT '[]' NOT NULL,
      "ai_feedback" text NOT NULL,
      "strengths" jsonb DEFAULT '[]' NOT NULL,
      "improvements" jsonb DEFAULT '[]' NOT NULL,
      "model_answer_summary" text,
      "earned_xp" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "simulation_attempts" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL,
      "sim_type" text NOT NULL,
      "title" text NOT NULL,
      "score" integer DEFAULT 0 NOT NULL,
      "metrics" jsonb DEFAULT '{}' NOT NULL,
      "ai_feedback" text,
      "earned_xp" integer DEFAULT 0 NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "course_enrollments" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL,
      "course_id" integer NOT NULL,
      "enrolled_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "course_enrollments_user_course_uniq" UNIQUE ("user_id", "course_id")
    );`,
    `CREATE TABLE IF NOT EXISTS "learning_paths" (
      "id" serial PRIMARY KEY,
      "slug" text NOT NULL UNIQUE,
      "title" text NOT NULL,
      "description" text NOT NULL,
      "target_role" text NOT NULL,
      "level" text DEFAULT 'Pemula hingga Mahir' NOT NULL,
      "badge_icon" text DEFAULT 'compass' NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "learning_path_courses" (
      "id" serial PRIMARY KEY,
      "path_id" integer NOT NULL,
      "course_id" integer NOT NULL,
      "step_order" integer DEFAULT 0 NOT NULL,
      CONSTRAINT "learning_path_courses_uniq" UNIQUE ("path_id", "course_id")
    );`,
    `CREATE TABLE IF NOT EXISTS "peer_reviews" (
      "id" serial PRIMARY KEY,
      "submission_id" integer NOT NULL,
      "reviewer_user_id" integer NOT NULL,
      "score" integer NOT NULL,
      "rubric_breakdown" jsonb DEFAULT '[]' NOT NULL,
      "feedback" text NOT NULL,
      "created_at" timestamp DEFAULT now(),
      CONSTRAINT "peer_reviews_sub_reviewer_uniq" UNIQUE ("submission_id", "reviewer_user_id")
    );`,
    `CREATE TABLE IF NOT EXISTS "talent_invitations" (
      "id" serial PRIMARY KEY,
      "recruiter_user_id" integer NOT NULL,
      "candidate_user_id" integer NOT NULL,
      "company_name" text NOT NULL,
      "job_title" text NOT NULL,
      "message" text NOT NULL,
      "status" text DEFAULT 'sent' NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,
  ];

  for (const sql of statements) {
    try {
      await pool.query(sql);
    } catch (err: any) {
      // Ignore if table in ALTER doesn't exist yet (42P01) or constraint already exists (42710)
      if (err?.code !== "42P01" && err?.code !== "42710") {
        console.warn("Schema statement warning:", err?.message || err);
      }
    }
  }
}
