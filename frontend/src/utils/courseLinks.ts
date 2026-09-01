import { Course } from '../types';

const YOUTUBE_SEARCH_BASE = 'https://www.youtube.com/results?search_query=';

export const getCourseUrl = (course: Pick<Course, 'title' | 'url'>) => {
  const rawUrl = course.url?.trim();

  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return parsed.toString();
      }
    } catch {
      // Fall through to search fallback for malformed database values.
    }
  }

  const query = `${course.title || 'online learning'} course`;
  return `${YOUTUBE_SEARCH_BASE}${encodeURIComponent(query)}`;
};
