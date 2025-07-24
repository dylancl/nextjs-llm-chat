import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * A robust React hook for auto-scrolling a chat-like interface.
 * ... (comments from previous version) ...
 *
 * @returns An object containing:
 * - `scrollContainerRef`: A ref for the scrollable container.
 * - `contentRef`: A ref for the content wrapper.
 * - `stickToBottom`: A function to forcefully scroll to bottom and keep it there.
 * - `showScrollToBottom`: A boolean indicating if the "scroll to bottom" button should be shown.
 */
export function useAutoScroll() {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const userScrolledUp = useRef(false);

  const isAtBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return true;
    const threshold = 50; // px
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <=
      threshold
    );
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    }
  }, []);

  /**
   * Forcefully scrolls to the bottom and ensures the view stays locked there
   * during subsequent content changes. Call this when you want to override the
   * user's scroll position, e.g., after sending a message.
   */
  const stickToBottom = useCallback(() => {
    userScrolledUp.current = false;
    setShowScrollToBottom(false);
    scrollToBottom('smooth');
  }, [scrollToBottom]);

  const handleScroll = useCallback(() => {
    if (isAtBottom()) {
      if (userScrolledUp.current) {
        userScrolledUp.current = false;
        setShowScrollToBottom(false);
      }
    } else {
      if (!userScrolledUp.current) {
        userScrolledUp.current = true;
        setShowScrollToBottom(true);
      }
    }
  }, [isAtBottom]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    const content = contentRef.current;
    if (!scrollContainer || !content) return;

    const observer = new ResizeObserver(() => {
      if (!userScrolledUp.current) {
        // Use 'auto' for streaming for a more instant, less bouncy feel
        scrollToBottom('auto');
      }
    });
    observer.observe(content);

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => {
      observer.disconnect();
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, scrollToBottom]);

  return {
    scrollContainerRef,
    contentRef,
    stickToBottom,
    showScrollToBottom,
  };
}
