import { relations } from 'drizzle-orm';
import { customType, integer, pgTable, serial, text, timestamp, boolean, unique, index, jsonb } from 'drizzle-orm/pg-core';

const jsonText = <T = any>(name: string) =>
  customType<{ data: T; driverData: string }>({
    dataType() {
      return 'text';
    },
    toDriver(value: T): string {
      return typeof value === 'string' ? value : JSON.stringify(value ?? null);
    },
    fromDriver(value: string): T {
      if (typeof value !== 'string') return value as T;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    },
  })(name);

export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  industry: text('industry').default('Teknologi & Digital').notNull(),
  logo: text('logo').default('🏢').notNull(),
  website: text('website'),
  location: text('location').default('Jakarta, Indonesia').notNull(),
  description: text('description'),
  verified: boolean('verified').default(false).notNull(),
  ownerUid: text('owner_uid').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('companies_owner_uid_idx').on(t.ownerUid),
]);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  level: integer('level').default(1).notNull(),
  xp: integer('xp').default(0).notNull(),
  gems: integer('gems').default(100).notNull(),
  streak: integer('streak').default(0).notNull(),
  streakFreezes: integer('streak_freezes').default(0).notNull(),
  lastActive: text('last_active'),
  role: text('role').default('Pelajar Siap Kerja').notNull(), // Display job/title label
  accountRole: text('account_role').default('student').notNull(), // 'student' | 'mentor' | 'recruiter' | 'admin'
  subscriptionTier: text('subscription_tier').default('free').notNull(), // 'free' | 'pro'
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  certCredits: integer('cert_credits').default(1).notNull(),
  companyId: integer('company_id').references(() => companies.id, { onDelete: 'set null' }),
  mentorSpecialty: text('mentor_specialty'),
  mentorHeadline: text('mentor_headline'),
  avatar: text('avatar').default('🦁'),
  username: text('username'),
  hasCompletedOnboarding: boolean('has_completed_onboarding').default(false).notNull(),
  onboardingGoal: text('onboarding_goal'),
  selectedLevelPref: text('selected_level_pref'),
  bio: text('bio'),
  mentorTone: text('mentor_tone').default('friendly').notNull(),
  notifyEmail: boolean('notify_email').default(true).notNull(),
  notifyDaily: boolean('notify_daily').default(true).notNull(),
  notifySound: boolean('notify_sound').default(true).notNull(),
  dailyClaimedLast: text('daily_claimed_last'),
  unlockedAvatars: jsonText<string[]>('unlocked_avatars'),
  purchasedItems: jsonText<string[]>('purchased_items'),
  skills: jsonText<string[]>('skills'),
  certifiedCourses: jsonText<string[]>('certified_courses'),
  careerStage: text('career_stage').default('learning').notNull(),
  activeBoosterUntil: timestamp('active_booster_until'),
  weeklyXp: integer('weekly_xp').default(0).notNull(),
  canRepairStreak: boolean('can_repair_streak').default(false).notNull(),
  lostStreakCount: integer('lost_streak_count').default(0).notNull(),
  dailyQuizXpCount: integer('daily_quiz_xp_count').default(0).notNull(),
  lastQuizXpDate: text('last_quiz_xp_date'),
  dailyQuests: jsonText<any[]>('daily_quests'),
  bookmarkedLessons: jsonText<string[]>('bookmarked_lessons'),
  portfolioSlug: text('portfolio_slug'),
  portfolioPublic: boolean('portfolio_public').default(true).notNull(),
  portfolioHeadline: text('portfolio_headline'),
  campusName: text('campus_name'),
  majorName: text('major_name'),
  leagueTier: text('league_tier').default('silver').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  index('users_uid_idx').on(t.uid),
  index('users_account_role_idx').on(t.accountRole),
  index('users_portfolio_slug_idx').on(t.portfolioSlug),
]);

export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  courseId: text('course_id').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category'),
  difficulty: text('difficulty').notNull(),
  duration: text('duration').notNull(),
  xpReward: integer('xp_reward').notNull(),
  partner: text('partner').notNull(),
  logo: text('logo').default('🎓').notNull(),
  image: text('image'),
  skills: jsonb('skills'),
  projectTitle: text('project_title'),
  projectDescription: text('project_description'),
  projectRubric: text('project_rubric'),
  status: text('status').default('published').notNull(), // 'draft' | 'published'
  isProOnly: boolean('is_pro_only').default(false).notNull(),
  authorUserId: integer('author_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('courses_course_id_idx').on(t.courseId),
  index('courses_author_idx').on(t.authorUserId),
]);

export const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  lessonId: text('lesson_id').notNull().unique(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  type: text('type').notNull(),
  orderIndex: integer('order_index').notNull(),
  xpReward: integer('xp_reward').notNull(),
  contentMarkdown: text('content_markdown'),
  videoUrl: text('video_url'),
  estimatedMinutes: integer('estimated_minutes').default(15).notNull(),
  questionsData: jsonb('questions_data'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('lessons_lesson_id_idx').on(t.lessonId),
  index('lessons_course_id_idx').on(t.courseId),
]);

export const userProgress = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }).notNull(),
  completed: boolean('completed').default(false).notNull(),
  completedAt: timestamp('completed_at').defaultNow(),
}, (t) => [
  unique('user_progress_user_course_lesson_uniq').on(t.userId, t.courseId, t.lessonId),
  index('user_progress_user_id_idx').on(t.userId),
  index('user_progress_course_id_idx').on(t.courseId),
  index('user_progress_lesson_id_idx').on(t.lessonId),
]);

export const bookmarks = pgTable('bookmarks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  unique('bookmarks_user_course_uniq').on(t.userId, t.courseId),
  index('bookmarks_user_id_idx').on(t.userId),
  index('bookmarks_course_id_idx').on(t.courseId),
]);

export const quizAttempts = pgTable('quiz_attempts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  courseId: integer('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  lessonId: integer('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }).notNull(),
  score: integer('score').notNull(),
  passed: boolean('passed').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('quiz_attempts_user_id_idx').on(t.userId),
  index('quiz_attempts_course_id_idx').on(t.courseId),
  index('quiz_attempts_lesson_id_idx').on(t.lessonId),
]);

export const quizSessions = pgTable('quiz_sessions', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull().unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  quizType: text('quiz_type').default('lesson').notNull(),
  courseId: text('course_id'),
  lessonId: text('lesson_id'),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  difficulty: text('difficulty').default('Menengah'),
  questionsData: jsonText<any[]>('questions_data').notNull(),
  answers: jsonText<Record<string, number>>('answers').default('{}' as any).notNull(),
  flaggedQuestions: jsonText<number[]>('flagged_questions').default('[]' as any).notNull(),
  status: text('status').default('in_progress').notNull(),
  score: integer('score'),
  passed: boolean('passed'),
  correctCount: integer('correct_count'),
  wrongCount: integer('wrong_count'),
  earnedXp: integer('earned_xp'),
  earnedGems: integer('earned_gems'),
  durationSeconds: integer('duration_seconds').default(300).notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('quiz_sessions_session_id_idx').on(t.sessionId),
  index('quiz_sessions_user_id_idx').on(t.userId),
  index('quiz_sessions_status_idx').on(t.status),
]);

export const questionsBank = pgTable('questions_bank', {
  id: serial('id').primaryKey(),
  category: text('category').notNull(),
  difficulty: integer('difficulty').default(2).notNull(), // 1 to 5
  prompt: text('prompt').notNull(),
  options: jsonb('options').notNull(),
  answerIndex: integer('answer_index').notNull(),
  explanation: text('explanation').notNull(),
  competencyTag: text('competency_tag').notNull(),
  createdByUserId: integer('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('questions_bank_cat_diff_idx').on(t.category, t.difficulty),
]);

export const adaptiveAssessments = pgTable('adaptive_assessments', {
  id: serial('id').primaryKey(),
  assessmentId: text('assessment_id').notNull().unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  category: text('category').notNull(),
  status: text('status').default('in_progress').notNull(), // 'in_progress' | 'completed'
  currentDifficulty: integer('current_difficulty').default(2).notNull(),
  abilityScore: integer('ability_score').default(50).notNull(),
  questionCount: integer('question_count').default(0).notNull(),
  maxQuestions: integer('max_questions').default(8).notNull(),
  currentQuestion: jsonb('current_question'),
  history: jsonb('history').default('[]').notNull(),
  weakTopics: jsonb('weak_topics').default('[]').notNull(),
  aiSummary: text('ai_summary'),
  earnedXp: integer('earned_xp').default(0).notNull(),
  earnedGems: integer('earned_gems').default(0).notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
}, (t) => [
  index('adaptive_assessments_id_idx').on(t.assessmentId),
  index('adaptive_assessments_user_idx').on(t.userId),
]);

export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  jobId: text('job_id').notNull().unique(),
  companyId: integer('company_id').references(() => companies.id, { onDelete: 'set null' }),
  companyName: text('company_name').notNull(),
  companyLogo: text('company_logo').default('🏢').notNull(),
  title: text('title').notNull(),
  salary: text('salary').notNull(),
  location: text('location').notNull(),
  jobType: text('job_type').default('Full-time').notNull(),
  requiredSkills: jsonb('required_skills').notNull(),
  description: text('description').notNull(),
  status: text('status').default('active').notNull(), // 'active' | 'closed'
  postedByUserId: integer('posted_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('jobs_job_id_idx').on(t.jobId),
  index('jobs_company_id_idx').on(t.companyId),
  index('jobs_status_idx').on(t.status),
]);

export const cvDocuments = pgTable('cv_documents', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').default('CV Utama ATS').notNull(),
  targetRole: text('target_role').notNull(),
  summary: text('summary').notNull(),
  experiences: jsonb('experiences').default('[]').notNull(),
  education: jsonb('education').default('[]').notNull(),
  projects: jsonb('projects').default('[]').notNull(),
  skills: jsonb('skills').default('[]').notNull(),
  atsScore: integer('ats_score').default(0).notNull(),
  atsFeedback: jsonb('ats_feedback'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  index('cv_documents_user_id_idx').on(t.userId),
]);

export const jobApplications = pgTable('job_applications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  jobId: text('job_id').notNull(),
  status: text('status').notNull(), // 'Terkirim' | 'Screening' | 'Interview' | 'Ditawarkan' | 'Ditolak'
  cvDocumentId: integer('cv_document_id').references(() => cvDocuments.id, { onDelete: 'set null' }),
  coverNote: text('cover_note'),
  hrNotes: text('hr_notes'),
  interviewAt: timestamp('interview_at'),
  appliedAt: timestamp('applied_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  unique('job_applications_user_job_uniq').on(t.userId, t.jobId),
  index('job_applications_user_id_idx').on(t.userId),
  index('job_applications_job_id_idx').on(t.jobId),
  index('job_applications_status_idx').on(t.status),
]);

export const jobBookmarks = pgTable('job_bookmarks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  jobId: text('job_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  unique('job_bookmarks_user_job_uniq').on(t.userId, t.jobId),
  index('job_bookmarks_user_id_idx').on(t.userId),
]);

export const interviewSessions = pgTable('interview_sessions', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull().unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  jobId: text('job_id'),
  jobTitle: text('job_title').notNull(),
  companyName: text('company_name').notNull(),
  mode: text('mode').default('voice').notNull(), // 'voice' | 'text'
  transcript: jsonb('transcript').default('[]').notNull(),
  overallScore: integer('overall_score'),
  communicationScore: integer('communication_score'),
  starScore: integer('star_score'),
  technicalScore: integer('technical_score'),
  strengths: jsonb('strengths'),
  improvements: jsonb('improvements'),
  summaryFeedback: text('summary_feedback'),
  durationSeconds: integer('duration_seconds').default(0).notNull(),
  status: text('status').default('active').notNull(), // 'active' | 'completed'
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
}, (t) => [
  index('interview_sessions_user_idx').on(t.userId),
  index('interview_sessions_sid_idx').on(t.sessionId),
]);

export const projectSubmissions = pgTable('project_submissions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  courseId: text('course_id').notNull(),
  projectUrl: text('project_url').notNull(),
  studentCodeNotes: text('student_code_notes'),
  status: text('status').notNull(), // 'pending', 'PASS', 'RETRY'
  score: integer('score'),
  strengths: jsonText<string[]>('strengths'),
  weaknesses: jsonText<string[]>('weaknesses'),
  feedback: text('feedback'),
  mentorReviewerId: integer('mentor_reviewer_id').references(() => users.id, { onDelete: 'set null' }),
  earnedCertificateId: text('earned_certificate_id'),
  submittedAt: timestamp('submitted_at').defaultNow(),
  reviewedAt: timestamp('reviewed_at'),
}, (t) => [
  index('project_submissions_user_id_idx').on(t.userId),
  index('project_submissions_status_idx').on(t.status),
]);

export const certificates = pgTable('certificates', {
  id: serial('id').primaryKey(),
  certificateId: text('certificate_id').notNull().unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  courseId: text('course_id').notNull(),
  recipientName: text('recipient_name').notNull(),
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
  score: integer('score'),
  status: text('status').default('valid').notNull(),
  verificationCode: text('verification_code'),
  projectSubmissionId: integer('project_submission_id').references(() => projectSubmissions.id, { onDelete: 'set null' }),
  revokedAt: timestamp('revoked_at'),
  metadata: jsonb('metadata'),
}, (t) => [
  index('certificates_certificate_id_idx').on(t.certificateId),
  index('certificates_user_id_idx').on(t.userId),
]);

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  text: text('text').notNull(),
  type: text('type').default('system').notNull(),
  read: boolean('read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('notifications_user_id_idx').on(t.userId),
]);

export const userAchievements = pgTable('user_achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  achievementId: text('achievement_id').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  target: integer('target').notNull(),
  current: integer('current').default(0).notNull(),
  unlocked: boolean('unlocked').default(false).notNull(),
  unlockedAt: text('unlocked_at'),
  xpReward: integer('xp_reward').notNull(),
  gemsReward: integer('gems_reward').notNull(),
  claimed: boolean('claimed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('user_achievements_user_achievement_idx').on(t.userId, t.achievementId),
  index('user_achievements_user_id_idx').on(t.userId),
]);

export const forumPosts = pgTable('forum_posts', {
  id: serial('id').primaryKey(),
  postId: text('post_id').notNull().unique(),
  authorUserId: integer('author_user_id').references(() => users.id, { onDelete: 'set null' }),
  authorName: text('author_name').notNull(),
  authorAvatar: text('author_avatar').default('👨‍💻').notNull(),
  authorLevel: integer('author_level').default(1).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  tags: jsonb('tags').default('[]').notNull(),
  upvotes: integer('upvotes').default(0).notNull(),
  isHot: boolean('is_hot').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('forum_posts_post_id_idx').on(t.postId),
]);

export const forumReplies = pgTable('forum_replies', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').references(() => forumPosts.id, { onDelete: 'cascade' }).notNull(),
  authorUserId: integer('author_user_id').references(() => users.id, { onDelete: 'set null' }),
  authorName: text('author_name').notNull(),
  authorAvatar: text('author_avatar').default('🦁').notNull(),
  authorRole: text('author_role').default('student').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('forum_replies_post_id_idx').on(t.postId),
]);

export const forumUpvotes = pgTable('forum_upvotes', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').references(() => forumPosts.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  unique('forum_upvotes_post_user_uniq').on(t.postId, t.userId),
]);

export const collabRooms = pgTable('collab_rooms', {
  id: serial('id').primaryKey(),
  roomId: text('room_id').notNull().unique(),
  courseId: text('course_id').notNull(),
  title: text('title').notNull(),
  members: jsonb('members').default('[]').notNull(),
  projectUrl: text('project_url').default('').notNull(),
  status: text('status').default('Belum Dikirim').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('collab_rooms_room_id_idx').on(t.roomId),
]);

export const collabTasks = pgTable('collab_tasks', {
  id: serial('id').primaryKey(),
  taskId: text('task_id').notNull().unique(),
  roomId: integer('room_id').references(() => collabRooms.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  assignee: text('assignee').notNull(),
  status: text('status').default('todo').notNull(), // 'todo' | 'in-progress' | 'review' | 'done'
  priority: text('priority').default('Sedang').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('collab_tasks_room_id_idx').on(t.roomId),
]);

export const collabMessages = pgTable('collab_messages', {
  id: serial('id').primaryKey(),
  messageId: text('message_id').notNull().unique(),
  roomId: integer('room_id').references(() => collabRooms.id, { onDelete: 'cascade' }).notNull(),
  sender: text('sender').notNull(),
  avatar: text('avatar').default('🦁').notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('collab_messages_room_id_idx').on(t.roomId),
]);

export const mentoringSlots = pgTable('mentoring_slots', {
  id: serial('id').primaryKey(),
  slotId: text('slot_id').notNull().unique(),
  mentorUserId: integer('mentor_user_id').references(() => users.id, { onDelete: 'cascade' }),
  mentorName: text('mentor_name').notNull(),
  mentorRole: text('mentor_role').notNull(),
  mentorCompany: text('mentor_company').notNull(),
  mentorAvatar: text('mentor_avatar').default('👨‍🏫').notNull(),
  topic: text('topic').notNull(),
  scheduleLabel: text('schedule_label').notNull(),
  durationMinutes: integer('duration_minutes').default(45).notNull(),
  priceGems: integer('price_gems').default(0).notNull(),
  maxQuota: integer('max_quota').default(5).notNull(),
  bookedCount: integer('booked_count').default(0).notNull(),
  status: text('status').default('open').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const mentoringBookings = pgTable('mentoring_bookings', {
  id: serial('id').primaryKey(),
  slotId: integer('slot_id').references(() => mentoringSlots.id, { onDelete: 'cascade' }).notNull(),
  studentUserId: integer('student_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  notes: text('notes'),
  mentorNotes: text('mentor_notes'),
  meetingLink: text('meeting_link'),
  status: text('status').default('confirmed').notNull(), // 'confirmed' | 'completed' | 'cancelled'
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  unique('mentoring_bookings_slot_student_uniq').on(t.slotId, t.studentUserId),
]);

export const scholarships = pgTable('scholarships', {
  id: serial('id').primaryKey(),
  scholarshipId: text('scholarship_id').notNull().unique(),
  title: text('title').notNull(),
  provider: text('provider').notNull(),
  degree: text('degree').notNull(),
  coverage: text('coverage').notNull(),
  deadline: text('deadline').notNull(),
  location: text('location').notNull(),
  description: text('description').notNull(),
  requirements: jsonb('requirements').default('[]').notNull(),
  applyUrl: text('apply_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  eventId: text('event_id').notNull().unique(),
  title: text('title').notNull(),
  speaker: text('speaker').notNull(),
  speakerRole: text('speaker_role').notNull(),
  category: text('category').notNull(),
  dateLabel: text('date_label').notNull(),
  timeLabel: text('time_label').notNull(),
  quota: integer('quota').default(100).notNull(),
  registeredCount: integer('registered_count').default(0).notNull(),
  xpReward: integer('xp_reward').default(100).notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const eventRegistrations = pgTable('event_registrations', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  unique('event_registrations_event_user_uniq').on(t.eventId, t.userId),
]);

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderCode: text('order_code').notNull().unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  productType: text('product_type').notNull(), // 'pro_monthly' | 'pro_yearly' | 'gems_pack' | 'cert_voucher'
  productId: text('product_id').notNull(),
  productName: text('product_name').notNull(),
  amountIdr: integer('amount_idr').notNull(),
  paymentMethod: text('payment_method').default('qris').notNull(),
  status: text('status').default('pending').notNull(), // 'pending' | 'paid' | 'failed' | 'expired'
  metadata: jsonb('metadata'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('orders_user_id_idx').on(t.userId),
  index('orders_order_code_idx').on(t.orderCode),
]);

export const walletLedger = pgTable('wallet_ledger', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  currency: text('currency').notNull(), // 'gems' | 'xp' | 'cert_credits'
  delta: integer('delta').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  reason: text('reason').notNull(),
  referenceId: text('reference_id'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('wallet_ledger_user_id_idx').on(t.userId),
]);

// --- Skillora 2.0 Upgrade Tables ---

export const labChallenges = pgTable('lab_challenges', {
  id: serial('id').primaryKey(),
  challengeId: text('challenge_id').notNull().unique(),
  title: text('title').notNull(),
  track: text('track').notNull(), // 'frontend' | 'backend_sql' | 'data' | 'bumn_case'
  difficulty: text('difficulty').default('Menengah').notNull(),
  estimatedMinutes: integer('estimated_minutes').default(25).notNull(),
  language: text('language').default('javascript').notNull(), // 'javascript' | 'sql' | 'case_markdown'
  summary: text('summary').notNull(),
  promptMarkdown: text('prompt_markdown').notNull(),
  starterCode: text('starter_code').notNull(),
  hints: jsonb('hints').default('[]').notNull(),
  testCases: jsonb('test_cases').default('[]').notNull(),
  rubricCriteria: jsonb('rubric_criteria').default('[]').notNull(),
  skills: jsonb('skills').default('[]').notNull(),
  xpReward: integer('xp_reward').default(180).notNull(),
  gemsReward: integer('gems_reward').default(25).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('lab_challenges_cid_idx').on(t.challengeId),
  index('lab_challenges_track_idx').on(t.track),
]);

export const labSubmissions = pgTable('lab_submissions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  challengeId: text('challenge_id').notNull(),
  codeOrAnswer: text('code_or_answer').notNull(),
  testPassedCount: integer('test_passed_count').default(0).notNull(),
  testTotalCount: integer('test_total_count').default(0).notNull(),
  score: integer('score').default(0).notNull(),
  rubricScores: jsonb('rubric_scores').default('[]').notNull(),
  aiFeedback: text('ai_feedback').notNull(),
  strengths: jsonb('strengths').default('[]').notNull(),
  improvements: jsonb('improvements').default('[]').notNull(),
  refactoredSnippet: text('refactored_snippet'),
  passed: boolean('passed').default(false).notNull(),
  earnedXp: integer('earned_xp').default(0).notNull(),
  earnedGems: integer('earned_gems').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('lab_submissions_user_idx').on(t.userId),
  index('lab_submissions_challenge_idx').on(t.challengeId),
]);

export const lessonNotes = pgTable('lesson_notes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  courseId: text('course_id').notNull(),
  lessonId: text('lesson_id').notNull(),
  content: text('content').default('').notNull(),
  isPinned: boolean('is_pinned').default(false).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  unique('lesson_notes_user_course_lesson_uniq').on(t.userId, t.courseId, t.lessonId),
  index('lesson_notes_user_idx').on(t.userId),
]);

export const studyRoadmaps = pgTable('study_roadmaps', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  targetRole: text('target_role').notNull(),
  hoursPerWeek: integer('hours_per_week').default(8).notNull(),
  summary: text('summary').notNull(),
  weeks: jsonb('weeks').default('[]').notNull(),
  progressPercent: integer('progress_percent').default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('study_roadmaps_user_idx').on(t.userId),
]);

export const arenaMatches = pgTable('arena_matches', {
  id: serial('id').primaryKey(),
  roomCode: text('room_code').notNull(),
  topic: text('topic').notNull(),
  mode: text('mode').default('battle').notNull(),
  status: text('status').default('finished').notNull(),
  hostUserId: integer('host_user_id').references(() => users.id, { onDelete: 'set null' }),
  participants: jsonb('participants').default('[]').notNull(),
  winnerName: text('winner_name'),
  questionCount: integer('question_count').default(5).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  finishedAt: timestamp('finished_at').defaultNow(),
}, (t) => [
  index('arena_matches_room_idx').on(t.roomCode),
]);

export const tryoutAttempts = pgTable('tryout_attempts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tryoutId: text('tryout_id').notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  score: integer('score').default(0).notNull(),
  maxScore: integer('max_score').default(100).notNull(),
  correctCount: integer('correct_count').default(0).notNull(),
  totalQuestions: integer('total_questions').default(10).notNull(),
  subtestScores: jsonb('subtest_scores').default('[]').notNull(),
  durationSeconds: integer('duration_seconds').default(0).notNull(),
  percentile: integer('percentile').default(50).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('tryout_attempts_user_idx').on(t.userId),
  index('tryout_attempts_tryout_idx').on(t.tryoutId),
]);

export const campusCohorts = pgTable('campus_cohorts', {
  id: serial('id').primaryKey(),
  cohortId: text('cohort_id').notNull().unique(),
  campusName: text('campus_name').notNull(),
  city: text('city').notNull(),
  programTitle: text('program_title').notNull(),
  targetRole: text('target_role').notNull(),
  activeStudents: integer('active_students').default(120).notNull(),
  avgReadiness: integer('avg_readiness').default(78).notNull(),
  certifiedCount: integer('certified_count').default(45).notNull(),
  featuredLabs: jsonb('featured_labs').default('[]').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('campus_cohorts_cid_idx').on(t.cohortId),
]);

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  recruiters: many(users),
  jobs: many(jobs),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  progress: many(userProgress),
  bookmarks: many(bookmarks),
  quizAttempts: many(quizAttempts),
  quizSessions: many(quizSessions),
  adaptiveAssessments: many(adaptiveAssessments),
  jobApplications: many(jobApplications),
  jobBookmarks: many(jobBookmarks),
  cvDocuments: many(cvDocuments),
  interviewSessions: many(interviewSessions),
  projectSubmissions: many(projectSubmissions),
  notifications: many(notifications),
  userAchievements: many(userAchievements),
  certificates: many(certificates),
  orders: many(orders),
  walletLedger: many(walletLedger),
}));

export const quizSessionsRelations = relations(quizSessions, ({ one }) => ({
  user: one(users, { fields: [quizSessions.userId], references: [users.id] }),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  author: one(users, { fields: [courses.authorUserId], references: [users.id] }),
  lessons: many(lessons),
  progress: many(userProgress),
  bookmarks: many(bookmarks),
  quizAttempts: many(quizAttempts),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, { fields: [lessons.courseId], references: [courses.id] }),
  progress: many(userProgress),
  quizAttempts: many(quizAttempts),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, { fields: [userProgress.userId], references: [users.id] }),
  course: one(courses, { fields: [userProgress.courseId], references: [courses.id] }),
  lesson: one(lessons, { fields: [userProgress.lessonId], references: [lessons.id] }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, { fields: [bookmarks.userId], references: [users.id] }),
  course: one(courses, { fields: [bookmarks.courseId], references: [courses.id] }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  user: one(users, { fields: [quizAttempts.userId], references: [users.id] }),
  course: one(courses, { fields: [quizAttempts.courseId], references: [courses.id] }),
  lesson: one(lessons, { fields: [quizAttempts.lessonId], references: [lessons.id] }),
}));

export const jobApplicationsRelations = relations(jobApplications, ({ one }) => ({
  user: one(users, { fields: [jobApplications.userId], references: [users.id] }),
  cvDocument: one(cvDocuments, { fields: [jobApplications.cvDocumentId], references: [cvDocuments.id] }),
}));

export const jobBookmarksRelations = relations(jobBookmarks, ({ one }) => ({
  user: one(users, { fields: [jobBookmarks.userId], references: [users.id] }),
}));

export const projectSubmissionsRelations = relations(projectSubmissions, ({ one }) => ({
  user: one(users, { fields: [projectSubmissions.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, { fields: [userAchievements.userId], references: [users.id] }),
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
  user: one(users, { fields: [certificates.userId], references: [users.id] }),
  projectSubmission: one(projectSubmissions, { fields: [certificates.projectSubmissionId], references: [projectSubmissions.id] }),
}));

export const forumPostsRelations = relations(forumPosts, ({ many }) => ({
  replies: many(forumReplies),
  upvotesList: many(forumUpvotes),
}));

export const forumRepliesRelations = relations(forumReplies, ({ one }) => ({
  post: one(forumPosts, { fields: [forumReplies.postId], references: [forumPosts.id] }),
}));

export const collabRoomsRelations = relations(collabRooms, ({ many }) => ({
  tasks: many(collabTasks),
  messages: many(collabMessages),
}));

export const collabTasksRelations = relations(collabTasks, ({ one }) => ({
  room: one(collabRooms, { fields: [collabTasks.roomId], references: [collabRooms.id] }),
}));

export const collabMessagesRelations = relations(collabMessages, ({ one }) => ({
  room: one(collabRooms, { fields: [collabMessages.roomId], references: [collabRooms.id] }),
}));

export const mentoringSlotsRelations = relations(mentoringSlots, ({ many }) => ({
  bookings: many(mentoringBookings),
}));

export const mentoringBookingsRelations = relations(mentoringBookings, ({ one }) => ({
  slot: one(mentoringSlots, { fields: [mentoringBookings.slotId], references: [mentoringSlots.id] }),
  student: one(users, { fields: [mentoringBookings.studentUserId], references: [users.id] }),
}));
