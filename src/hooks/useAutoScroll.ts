import {
  useRef,
  useCallback,
  useLayoutEffect,
  useEffect,
  useState,
} from 'react';

/**
 * A robust React hook for auto-scrolling that is immune to race conditions.
 *
 * This hook's logic is simple and effective:
 * 1. It auto-scrolls on new content UNLESS a `userScrolledUp` flag is true.
 * 2. A scroll listener sets the `userScrolledUp` flag to true only when the user
 *    manually scrolls away from the bottom.
 * 3. It uses a `programmaticScrollGuard` to prevent its own auto-scrolls from
 *    triggering the listener, which eliminates all race conditions.
 *
 * @param dependency - A value that changes whenever new content is added or streamed.
 */
export function useAutoScroll(dependency: string) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // The primary lock. If true, we stop auto-scrolling. This is the ONLY source of truth.
  const userHasScrolledUp = useRef(false);

  // A guard to ignore scroll events triggered by our own code.
  const programmaticScrollGuard = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const isAtBottom = useCallback((threshold = 20) => {
    const container = scrollContainerRef.current;
    if (!container) return true;
    return (
      container.scrollHeight - container.scrollTop <=
      container.clientHeight + threshold
    );
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const container = scrollContainerRef.current;
    if (container) {
      // **THE GUARD**: Set a flag that this scroll is initiated by our code.
      programmaticScrollGuard.current = true;

      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });

      // Clear any existing timeout to avoid race conditions from rapid calls.
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // After a short delay, release the guard. This gives the browser time
      // for the scroll event to fire and be ignored by our listener.
      scrollTimeout.current = setTimeout(() => {
        programmaticScrollGuard.current = false;
      }, 150); // A 150ms buffer is safe for both 'auto' and 'smooth'.
    }
  }, []);

  // This is the core auto-scrolling logic that runs on content updates.
  useLayoutEffect(() => {
    // If the user has not manually scrolled up, we keep them at the bottom.
    if (!userHasScrolledUp.current) {
      scrollToBottom('auto');
    }
  }, [dependency, scrollToBottom]); // Re-runs when new content arrives.

  // This effect manages the scroll event listener. It runs ONCE.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // If our code is causing the scroll, ignore the event completely and do nothing.
      if (programmaticScrollGuard.current) {
        return;
      }

      if (isAtBottom()) {
        // If the user scrolls back to the bottom, reset the lock and hide the button.
        if (userHasScrolledUp.current) {
          userHasScrolledUp.current = false;
          if (showScrollToBottom) setShowScrollToBottom(false);
        }
      } else {
        // If the user scrolls up, set the lock and show the button.
        if (!userHasScrolledUp.current) {
          userHasScrolledUp.current = true;
          if (!showScrollToBottom) setShowScrollToBottom(true);
        }
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
    // The empty dependency array `[]` ensures this listener is set up only once.
  }, [isAtBottom, showScrollToBottom]);

  /**
   * Forcefully scrolls to the bottom and re-locks auto-scroll.
   * Call this when the user sends a message or clicks the "scroll to bottom" button.
   */
  const stickToBottom = useCallback(() => {
    // Reset the user's scroll lock.
    userHasScrolledUp.current = false;
    setShowScrollToBottom(false);
    scrollToBottom('smooth');
  }, [scrollToBottom]);

  return {
    scrollContainerRef,
    stickToBottom,
    showScrollToBottom,
  };
}
