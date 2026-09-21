import { School } from '../types';

/**
 * Normalizes strings for robust URL slug matching.
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Finds a school matching an input string from URL (ID, short name, IG handle, or full name).
 * E.g., 'emory', 'emory2031', '@emory2031', 'harvard', 'texas-am', 'tamu'.
 */
export function findSchoolBySlug(slug: string | null | undefined, schools: School[]): School | undefined {
  if (!slug) return undefined;
  const raw = slug.trim().toLowerCase();
  const cleaned = normalize(raw).replace(/2031$/, '');

  // 1. Exact ID match
  const exactId = schools.find((s) => s.id.toLowerCase() === raw);
  if (exactId) return exactId;

  // 2. Normalized ID match
  const normId = schools.find((s) => normalize(s.id) === cleaned);
  if (normId) return normId;

  // 3. Short name match
  const shortMatch = schools.find((s) => normalize(s.shortName) === cleaned);
  if (shortMatch) return shortMatch;

  // 4. Instagram handle match (e.g., '@emory2031')
  const igMatch = schools.find((s) => {
    if (!s.instagramHandle) return false;
    const igNorm = normalize(s.instagramHandle).replace(/2031$/, '');
    return igNorm === cleaned;
  });
  if (igMatch) return igMatch;

  // 5. Full name substring match
  const nameMatch = schools.find((s) => normalize(s.name).includes(cleaned) || cleaned.includes(normalize(s.name)));
  if (nameMatch) return nameMatch;

  return undefined;
}

/**
 * Generates the clean Link 1 (Main Page / School Hub) for Instagram Bio.
 */
export function getSchoolMainPageUrl(school: School, customBaseUrl?: string): string {
  const base = (customBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');
  return `${base}/?school=${encodeURIComponent(school.id)}`;
}

/**
 * Generates the direct Link 2 (Instant Posting & Feature Submission Form) for Instagram Bio.
 */
export function getSchoolPostingUrl(school: School, customBaseUrl?: string): string {
  const base = (customBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');
  return `${base}/?school=${encodeURIComponent(school.id)}&post=1`;
}

/**
 * Parses current window location (pathname, query params, hash) to determine intended school and view.
 */
export function parseCurrentUrl(schools: School[]): { view: 'schools' | 'post'; school?: School } {
  if (typeof window === 'undefined') {
    return { view: 'schools' };
  }

  const pathname = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);

  // Check query parameters:
  // e.g. ?school=emory&post=1 or ?post=emory or ?submit=emory
  const postParam = searchParams.get('post') || searchParams.get('submit') || searchParams.get('action');
  const schoolParam = searchParams.get('school') || searchParams.get('campus') || searchParams.get('s');

  // Case A: Direct post param with school name (e.g. ?post=emory)
  if (postParam && postParam !== '1' && postParam !== 'true') {
    const matched = findSchoolBySlug(postParam, schools);
    if (matched) {
      return { view: 'post', school: matched };
    }
  }

  // Case B: School param provided with post flag (e.g. ?school=emory&post=1)
  if (schoolParam) {
    const matched = findSchoolBySlug(schoolParam, schools);
    if (matched) {
      const isPost = postParam === '1' || postParam === 'true' || postParam === 'post';
      return { view: isPost ? 'post' : 'schools', school: matched };
    }
  }

  // Case C: Path-based URL (e.g. /post/emory or /submit/emory or /school/emory)
  const postPathMatch = pathname.match(/^\/(?:post|submit|feature)\/([^/]+)/);
  if (postPathMatch) {
    const matched = findSchoolBySlug(postPathMatch[1], schools);
    if (matched) {
      return { view: 'post', school: matched };
    }
  }

  const schoolPathMatch = pathname.match(/^\/(?:school|campus)\/([^/]+)/);
  if (schoolPathMatch) {
    const matched = findSchoolBySlug(schoolPathMatch[1], schools);
    if (matched) {
      return { view: 'schools', school: matched };
    }
  }

  // Case D: Hash-based URL (e.g. #/post/emory or #/school/emory)
  const postHashMatch = hash.match(/#(?:post|submit)\/([^/]+)/);
  if (postHashMatch) {
    const matched = findSchoolBySlug(postHashMatch[1], schools);
    if (matched) {
      return { view: 'post', school: matched };
    }
  }

  // Fallback check for legacy tokens in hash/path
  if (hash.includes('emory2031') || pathname.includes('emory2031')) {
    const emory = schools.find((s) => s.id === 'emory');
    if (emory) return { view: 'post', school: emory };
  }

  return { view: 'schools' };
}
