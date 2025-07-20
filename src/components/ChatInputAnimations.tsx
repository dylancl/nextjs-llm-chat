import React from 'react';

/**
 * Injects keyframe and animation styles for ChatInput streaming effects.
 * Only renders children if provided (for conditional style injection).
 */
export const ChatInputAnimations: React.FC<{ active?: boolean }> = ({
  active,
}) => {
  if (!active) return null;
  return (
    <style jsx>{`
      @keyframes aurora-fast {
        0%,
        100% {
          transform: rotate(0deg) scale(1);
          opacity: 0.7;
        }
        25% {
          transform: rotate(90deg) scale(1.05);
          opacity: 0.9;
        }
        50% {
          transform: rotate(180deg) scale(1.1);
          opacity: 1;
        }
        75% {
          transform: rotate(270deg) scale(1.05);
          opacity: 0.9;
        }
      }

      @keyframes aurora-medium {
        0%,
        100% {
          transform: rotate(0deg) scale(1);
          opacity: 0.6;
        }
        33% {
          transform: rotate(120deg) scale(1.03);
          opacity: 0.8;
        }
        66% {
          transform: rotate(240deg) scale(1.06);
          opacity: 0.9;
        }
      }

      @keyframes aurora-slow {
        0%,
        100% {
          transform: rotate(0deg) scale(1);
          opacity: 0.5;
        }
        50% {
          transform: rotate(180deg) scale(1.02);
          opacity: 0.7;
        }
      }

      @keyframes shimmer {
        0% {
          transform: translateX(-100%) skewX(-15deg);
          opacity: 0;
        }
        50% {
          opacity: 0.6;
        }
        100% {
          transform: translateX(200%) skewX(-15deg);
          opacity: 0;
        }
      }

      @keyframes breathe {
        0%,
        100% {
          transform: scale(1);
          filter: blur(0px);
        }
        50% {
          transform: scale(1.02);
          filter: blur(0.5px);
        }
      }

      .animate-aurora-fast {
        animation: aurora-fast 1.5s linear infinite;
      }

      .animate-aurora-medium {
        animation: aurora-medium 2s linear infinite;
      }

      .animate-aurora-slow {
        animation: aurora-slow 3s linear infinite;
      }

      .animate-shimmer {
        animation: shimmer 2s ease-in-out infinite;
      }

      .animate-breathe {
        animation: breathe 2s ease-in-out infinite;
      }
    `}</style>
  );
};
