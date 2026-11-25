import courseBumnImg from "../assets/images/course_bumn_prep_1794974023438.jpg";
import courseTechImg from "../assets/images/course_tech_engineering_1794974031663.jpg";
import courseAiImg from "../assets/images/course_ai_automation_1795577727396.jpg";
import courseProductImg from "../assets/images/course_product_ux_1795577728388.jpg";
import courseCloudImg from "../assets/images/course_cloud_devops_1795577730437.jpg";
import courseCpnsImg from "../assets/images/course_cpns_finance_1795577729361.jpg";
import editorialCareerImg from "../assets/images/editorial_career_arena_1795521082924.jpg";
import editorialCodingImg from "../assets/images/editorial_coding_lab_1795521088285.jpg";
import heroCampusImg from "../assets/images/hero_skillora_campus_1794974023605.jpg";

const ASSET_MAP: Record<string, string> = {
  "course_bumn_prep_1794974023438.jpg": courseBumnImg,
  "course_tech_engineering_1794974031663.jpg": courseTechImg,
  "course_ai_automation_1795577727396.jpg": courseAiImg,
  "course_product_ux_1795577728388.jpg": courseProductImg,
  "course_cloud_devops_1795577730437.jpg": courseCloudImg,
  "course_cpns_finance_1795577729361.jpg": courseCpnsImg,
  "editorial_career_arena_1795521082924.jpg": editorialCareerImg,
  "editorial_coding_lab_1795521088285.jpg": editorialCodingImg,
  "hero_skillora_campus_1794974023605.jpg": heroCampusImg,
};

/**
 * Resolves raw `/src/assets/images/...` paths stored in DB/seed data into
 * Vite-bundled hashed asset URLs so production builds never 404.
 */
export function resolveCourseImage(rawUrl?: string | null): string {
  if (!rawUrl) return courseTechImg;
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://") || rawUrl.startsWith("data:")) {
    return rawUrl;
  }
  const filename = rawUrl.split("/").pop() || "";
  if (ASSET_MAP[filename]) {
    return ASSET_MAP[filename];
  }
  return rawUrl.startsWith("/src/") ? courseTechImg : rawUrl;
}
