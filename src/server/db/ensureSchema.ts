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
             'course_exams', 'flashcard_progress', 'training_assignments', 'simulation_attempts',
             'talent_invitations', 'wallet_ledger'
           )) AS table_cnt,
        (SELECT count(*)::int FROM information_schema.columns
         WHERE table_schema = 'public'
           AND (
             (table_name = 'users' AND column_name = 'portfolio_slug') OR
             (table_name = 'users' AND column_name = 'weekly_target_days') OR
             (table_name = 'courses' AND column_name = 'linked_lab_ids') OR
             (table_name = 'lessons' AND column_name = 'flashcards') OR
             (table_name = 'certificates' AND column_name = 'certificate_type')
           )) AS col_cnt
    `);
    const row = checkRes.rows?.[0];
    if (Number(row?.table_cnt) >= 10 && Number(row?.col_cnt) >= 5) {
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
    `CREATE TABLE IF NOT EXISTS "courses" (
      "id" serial PRIMARY KEY,
      "course_id" text NOT NULL UNIQUE,
      "title" text NOT NULL,
      "description" text NOT NULL,
      "category" text,
      "difficulty" text NOT NULL,
      "duration" text NOT NULL,
      "xp_reward" integer NOT NULL,
      "partner" text NOT NULL,
      "logo" text DEFAULT '🎓' NOT NULL,
      "image" text,
      "skills" jsonb,
      "project_title" text,
      "project_description" text,
      "project_rubric" text,
      "linked_lab_ids" jsonb DEFAULT '[]' NOT NULL,
      "case_prompt" jsonb,
      "status" text DEFAULT 'published' NOT NULL,
      "is_pro_only" boolean DEFAULT false NOT NULL,
      "author_user_id" integer,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "lessons" (
      "id" serial PRIMARY KEY,
      "lesson_id" text NOT NULL UNIQUE,
      "course_id" integer NOT NULL,
      "title" text NOT NULL,
      "type" text NOT NULL,
      "order_index" integer NOT NULL,
      "xp_reward" integer NOT NULL,
      "content_markdown" text,
      "video_url" text,
      "estimated_minutes" integer DEFAULT 15 NOT NULL,
      "questions_data" jsonb,
      "inline_checks" jsonb DEFAULT '[]' NOT NULL,
      "flashcards" jsonb DEFAULT '[]' NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "jobs" (
      "id" serial PRIMARY KEY,
      "job_id" text NOT NULL UNIQUE,
      "company_id" integer,
      "company_name" text NOT NULL,
      "company_logo" text DEFAULT '🏢' NOT NULL,
      "title" text NOT NULL,
      "salary" text NOT NULL,
      "location" text NOT NULL,
      "job_type" text DEFAULT 'Full-time' NOT NULL,
      "required_skills" jsonb NOT NULL,
      "description" text NOT NULL,
      "status" text DEFAULT 'active' NOT NULL,
      "posted_by_user_id" integer,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "certificates" (
      "id" serial PRIMARY KEY,
      "certificate_id" text NOT NULL UNIQUE,
      "user_id" integer NOT NULL,
      "course_id" text NOT NULL,
      "certificate_type" text DEFAULT 'course' NOT NULL,
      "path_slug" text,
      "recipient_name" text NOT NULL,
      "issued_at" timestamp DEFAULT now() NOT NULL,
      "score" integer,
      "status" text DEFAULT 'valid' NOT NULL,
      "verification_code" text,
      "project_submission_id" integer,
      "revoked_at" timestamp,
      "metadata" jsonb
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
    `CREATE TABLE IF NOT EXISTS "user_progress" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL,
      "course_id" integer NOT NULL,
      "lesson_id" integer NOT NULL,
      "completed" boolean DEFAULT false NOT NULL,
      "completed_at" timestamp DEFAULT now(),
      CONSTRAINT "user_progress_user_course_lesson_uniq" UNIQUE ("user_id", "course_id", "lesson_id")
    );`,
    `CREATE TABLE IF NOT EXISTS "bookmarks" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL,
      "course_id" integer NOT NULL,
      "created_at" timestamp DEFAULT now(),
      CONSTRAINT "bookmarks_user_course_uniq" UNIQUE ("user_id", "course_id")
    );`,
    `CREATE TABLE IF NOT EXISTS "quiz_attempts" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL,
      "course_id" integer NOT NULL,
      "lesson_id" integer NOT NULL,
      "score" integer NOT NULL,
      "passed" boolean NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "quiz_sessions" (
      "id" serial PRIMARY KEY,
      "session_id" text NOT NULL UNIQUE,
      "user_id" integer NOT NULL,
      "quiz_type" text DEFAULT 'lesson' NOT NULL,
      "course_id" text,
      "lesson_id" text,
      "title" text NOT NULL,
      "subtitle" text,
      "difficulty" text DEFAULT 'Menengah',
      "questions_data" text NOT NULL,
      "answers" text DEFAULT '{}' NOT NULL,
      "flagged_questions" text DEFAULT '[]' NOT NULL,
      "status" text DEFAULT 'in_progress' NOT NULL,
      "score" integer,
      "passed" boolean,
      "correct_count" integer,
      "wrong_count" integer,
      "earned_xp" integer,
      "earned_gems" integer,
      "duration_seconds" integer DEFAULT 300 NOT NULL,
      "started_at" timestamp DEFAULT now() NOT NULL,
      "expires_at" timestamp,
      "completed_at" timestamp,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "questions_bank" (
      "id" serial PRIMARY KEY,
      "category" text NOT NULL,
      "difficulty" integer DEFAULT 2 NOT NULL,
      "prompt" text NOT NULL,
      "options" jsonb NOT NULL,
      "answer_index" integer NOT NULL,
      "explanation" text NOT NULL,
      "competency_tag" text NOT NULL,
      "created_by_user_id" integer,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "adaptive_assessments" (
      "id" serial PRIMARY KEY,
      "assessment_id" text NOT NULL UNIQUE,
      "user_id" integer NOT NULL,
      "category" text NOT NULL,
      "status" text DEFAULT 'in_progress' NOT NULL,
      "current_difficulty" integer DEFAULT 2 NOT NULL,
      "ability_score" integer DEFAULT 50 NOT NULL,
      "question_count" integer DEFAULT 0 NOT NULL,
      "max_questions" integer DEFAULT 8 NOT NULL,
      "current_question" jsonb,
      "history" jsonb DEFAULT '[]' NOT NULL,
      "weak_topics" jsonb DEFAULT '[]' NOT NULL,
      "ai_summary" text,
      "earned_xp" integer DEFAULT 0 NOT NULL,
      "earned_gems" integer DEFAULT 0 NOT NULL,
      "started_at" timestamp DEFAULT now() NOT NULL,
      "completed_at" timestamp
    );`,
    `CREATE TABLE IF NOT EXISTS "cv_documents" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL,
      "title" text DEFAULT 'CV Utama ATS' NOT NULL,
      "target_role" text NOT NULL,
      "summary" text NOT NULL,
      "experiences" jsonb DEFAULT '[]' NOT NULL,
      "education" jsonb DEFAULT '[]' NOT NULL,
      "projects" jsonb DEFAULT '[]' NOT NULL,
      "skills" jsonb DEFAULT '[]' NOT NULL,
      "ats_score" integer DEFAULT 0 NOT NULL,
      "ats_feedback" jsonb,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "job_applications" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL,
      "job_id" text NOT NULL,
      "status" text NOT NULL,
      "cv_document_id" integer,
      "cover_note" text,
      "hr_notes" text,
      "interview_at" timestamp,
      "applied_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now(),
      CONSTRAINT "job_applications_user_job_uniq" UNIQUE ("user_id", "job_id")
    );`,
    `CREATE TABLE IF NOT EXISTS "job_bookmarks" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL,
      "job_id" text NOT NULL,
      "created_at" timestamp DEFAULT now(),
      CONSTRAINT "job_bookmarks_user_job_uniq" UNIQUE ("user_id", "job_id")
    );`,
    `CREATE TABLE IF NOT EXISTS "interview_sessions" (
      "id" serial PRIMARY KEY,
      "session_id" text NOT NULL UNIQUE,
      "user_id" integer NOT NULL,
      "job_id" text,
      "job_title" text NOT NULL,
      "company_name" text NOT NULL,
      "mode" text DEFAULT 'voice' NOT NULL,
      "transcript" jsonb DEFAULT '[]' NOT NULL,
      "overall_score" integer,
      "communication_score" integer,
      "star_score" integer,
      "technical_score" integer,
      "strengths" jsonb,
      "improvements" jsonb,
      "summary_feedback" text,
      "duration_seconds" integer DEFAULT 0 NOT NULL,
      "status" text DEFAULT 'active' NOT NULL,
      "created_at" timestamp DEFAULT now(),
      "completed_at" timestamp
    );`,
    `CREATE TABLE IF NOT EXISTS "project_submissions" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL,
      "course_id" text NOT NULL,
      "project_url" text NOT NULL,
      "student_code_notes" text,
      "status" text NOT NULL,
      "score" integer,
      "strengths" text,
      "weaknesses" text,
      "feedback" text,
      "mentor_reviewer_id" integer,
      "earned_certificate_id" text,
      "submitted_at" timestamp DEFAULT now(),
      "reviewed_at" timestamp
    );`,
    `CREATE TABLE IF NOT EXISTS "notifications" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL,
      "text" text NOT NULL,
      "type" text DEFAULT 'system' NOT NULL,
      "read" boolean DEFAULT false NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "user_achievements" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL,
      "achievement_id" text NOT NULL,
      "title" text NOT NULL,
      "description" text NOT NULL,
      "icon" text NOT NULL,
      "target" integer NOT NULL,
      "current" integer DEFAULT 0 NOT NULL,
      "unlocked" boolean DEFAULT false NOT NULL,
      "unlocked_at" text,
      "xp_reward" integer NOT NULL,
      "gems_reward" integer NOT NULL,
      "claimed" boolean DEFAULT false NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "forum_posts" (
      "id" serial PRIMARY KEY,
      "post_id" text NOT NULL UNIQUE,
      "author_user_id" integer,
      "author_name" text NOT NULL,
      "author_avatar" text DEFAULT '👨‍💻' NOT NULL,
      "author_level" integer DEFAULT 1 NOT NULL,
      "title" text NOT NULL,
      "content" text NOT NULL,
      "tags" jsonb DEFAULT '[]' NOT NULL,
      "upvotes" integer DEFAULT 0 NOT NULL,
      "is_hot" boolean DEFAULT false NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "forum_replies" (
      "id" serial PRIMARY KEY,
      "post_id" integer NOT NULL,
      "author_user_id" integer,
      "author_name" text NOT NULL,
      "author_avatar" text DEFAULT '🦁' NOT NULL,
      "author_role" text DEFAULT 'student' NOT NULL,
      "content" text NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "forum_upvotes" (
      "id" serial PRIMARY KEY,
      "post_id" integer NOT NULL,
      "user_id" integer NOT NULL,
      "created_at" timestamp DEFAULT now(),
      CONSTRAINT "forum_upvotes_post_user_uniq" UNIQUE ("post_id", "user_id")
    );`,
    `CREATE TABLE IF NOT EXISTS "collab_rooms" (
      "id" serial PRIMARY KEY,
      "room_id" text NOT NULL UNIQUE,
      "course_id" text NOT NULL,
      "title" text NOT NULL,
      "members" jsonb DEFAULT '[]' NOT NULL,
      "project_url" text DEFAULT '' NOT NULL,
      "status" text DEFAULT 'Belum Dikirim' NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "collab_tasks" (
      "id" serial PRIMARY KEY,
      "task_id" text NOT NULL UNIQUE,
      "room_id" integer NOT NULL,
      "title" text NOT NULL,
      "assignee" text NOT NULL,
      "status" text DEFAULT 'todo' NOT NULL,
      "priority" text DEFAULT 'Sedang' NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "collab_messages" (
      "id" serial PRIMARY KEY,
      "message_id" text NOT NULL UNIQUE,
      "room_id" integer NOT NULL,
      "sender" text NOT NULL,
      "avatar" text DEFAULT '🦁' NOT NULL,
      "text" text NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "mentoring_slots" (
      "id" serial PRIMARY KEY,
      "slot_id" text NOT NULL UNIQUE,
      "mentor_user_id" integer,
      "mentor_name" text NOT NULL,
      "mentor_role" text NOT NULL,
      "mentor_company" text NOT NULL,
      "mentor_avatar" text DEFAULT '👨‍🏫' NOT NULL,
      "topic" text NOT NULL,
      "schedule_label" text NOT NULL,
      "duration_minutes" integer DEFAULT 45 NOT NULL,
      "price_gems" integer DEFAULT 0 NOT NULL,
      "max_quota" integer DEFAULT 5 NOT NULL,
      "booked_count" integer DEFAULT 0 NOT NULL,
      "status" text DEFAULT 'open' NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "mentoring_bookings" (
      "id" serial PRIMARY KEY,
      "slot_id" integer NOT NULL,
      "student_user_id" integer NOT NULL,
      "notes" text,
      "mentor_notes" text,
      "meeting_link" text,
      "status" text DEFAULT 'confirmed' NOT NULL,
      "created_at" timestamp DEFAULT now(),
      CONSTRAINT "mentoring_bookings_slot_student_uniq" UNIQUE ("slot_id", "student_user_id")
    );`,
    `CREATE TABLE IF NOT EXISTS "scholarships" (
      "id" serial PRIMARY KEY,
      "scholarship_id" text NOT NULL UNIQUE,
      "title" text NOT NULL,
      "provider" text NOT NULL,
      "degree" text NOT NULL,
      "coverage" text NOT NULL,
      "deadline" text NOT NULL,
      "location" text NOT NULL,
      "description" text NOT NULL,
      "requirements" jsonb DEFAULT '[]' NOT NULL,
      "apply_url" text,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "events" (
      "id" serial PRIMARY KEY,
      "event_id" text NOT NULL UNIQUE,
      "title" text NOT NULL,
      "speaker" text NOT NULL,
      "speaker_role" text NOT NULL,
      "category" text NOT NULL,
      "date_label" text NOT NULL,
      "time_label" text NOT NULL,
      "quota" integer DEFAULT 100 NOT NULL,
      "registered_count" integer DEFAULT 0 NOT NULL,
      "xp_reward" integer DEFAULT 100 NOT NULL,
      "description" text NOT NULL,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "event_registrations" (
      "id" serial PRIMARY KEY,
      "event_id" integer NOT NULL,
      "user_id" integer NOT NULL,
      "created_at" timestamp DEFAULT now(),
      CONSTRAINT "event_registrations_event_user_uniq" UNIQUE ("event_id", "user_id")
    );`,
    `CREATE TABLE IF NOT EXISTS "orders" (
      "id" serial PRIMARY KEY,
      "order_code" text NOT NULL UNIQUE,
      "user_id" integer NOT NULL,
      "product_type" text NOT NULL,
      "product_id" text NOT NULL,
      "product_name" text NOT NULL,
      "amount_idr" integer NOT NULL,
      "payment_method" text DEFAULT 'qris' NOT NULL,
      "status" text DEFAULT 'pending' NOT NULL,
      "metadata" jsonb,
      "paid_at" timestamp,
      "created_at" timestamp DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS "wallet_ledger" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL,
      "currency" text NOT NULL,
      "delta" integer NOT NULL,
      "balance_after" integer NOT NULL,
      "reason" text NOT NULL,
      "reference_id" text,
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
