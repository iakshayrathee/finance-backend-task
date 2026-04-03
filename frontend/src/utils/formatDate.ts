import { formatDistanceToNow, format, parseISO } from 'date-fns';

/** Format a date string as "MMM d, yyyy" */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
}

/** Format a date + time: "MMM d, yyyy HH:mm" */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy HH:mm');
}

/** Relative time: "2 minutes ago" */
export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

/** Short relative: strips "about" for compact display */
export function timeAgoShort(date: string | Date): string {
  return timeAgo(date).replace('about ', '').replace('less than a minute ago', 'just now');
}
