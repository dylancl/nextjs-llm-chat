/**
 * Safely formats a timestamp that could be either a Date object or a string
 * This helps prevent hydration errors and runtime crashes
 */
export function formatTimestamp(
  timestamp: Date | string,
  options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  }
): string {
  try {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return '--:--';
    }

    return date.toLocaleTimeString([], options);
  } catch (error) {
    console.warn('Failed to format timestamp:', timestamp, error);
    return '--:--';
  }
}

/**
 * Client-safe timestamp formatter that handles SSR/hydration issues
 */
export function formatTimestampClient(
  timestamp: Date | string,
  options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  }
): string {
  // During SSR, return a stable fallback
  if (typeof window === 'undefined') {
    return '--:--';
  }

  return formatTimestamp(timestamp, options);
}
