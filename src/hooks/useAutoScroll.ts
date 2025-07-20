import { useRef, useCallback, useEffect, useState } from 'react';
import { Message } from '@/hooks/useMessages';

interface UseAutoScrollOptions {
  messages: Message[];
  isLoading?: boolean;
}

/**
 * Robust chat auto-scroll hook for chat UIs.
 * - Auto-scrolls to bottom on new messages unless user scrolled up.
 * - Exposes state for showing a "scroll to bottom" button.
 * - Handles resize and fast message arrival.
 */
export function useAutoScroll({
  messages,
  isLoading = false,
}: UseAutoScrollOptions) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const atBottomRef = useRef(true);

  // Helper: check if user is at (or near) bottom
  const checkAtBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return true;
    const threshold = 32;
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollTop + clientHeight >= scrollHeight - threshold;
  }, []);

  // Scroll event handler
  const handleScroll = useCallback(() => {
    const atBottom = checkAtBottom();
    atBottomRef.current = atBottom;
    setShowScrollToBottom(!atBottom);
  }, [checkAtBottom]);

  // Scroll to bottom (optionally smooth)
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
    atBottomRef.current = true;
    setShowScrollToBottom(false);
  }, []);

  // On new messages: auto-scroll only if user is at bottom at the moment message arrives
  useEffect(() => {
    if (messages.length === 0) return;
    if (atBottomRef.current) {
      requestAnimationFrame(() => scrollToBottom('auto'));
    }
  }, [messages, scrollToBottom]);

  // On loading: auto-scroll ONLY if user is at bottom
  useEffect(() => {
    if (!isLoading) return;
    if (atBottomRef.current) {
      scrollToBottom('smooth');
    }
  }, [isLoading, scrollToBottom]);

  // Listen for scroll events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Listen for resize events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleResize = () => {
      if (checkAtBottom()) {
        scrollToBottom('auto');
      }
    };
    window.addEventListener('resize', handleResize);
    let observer: ResizeObserver | null = null;
    if ('ResizeObserver' in window) {
      observer = new ResizeObserver(handleResize);
      observer.observe(container);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
    };
  }, [checkAtBottom, scrollToBottom]);

  // Manual scroll-to-bottom (e.g., button click)
  const scrollToBottomManual = useCallback(() => {
    scrollToBottom('smooth');
  }, [scrollToBottom]);

  return {
    scrollContainerRef,
    messagesEndRef,
    showScrollToBottom,
    scrollToBottom: scrollToBottomManual,
  };
}
