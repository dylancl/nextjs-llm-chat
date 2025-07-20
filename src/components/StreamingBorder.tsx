import React from 'react';

type StreamingConfig = {
  borderColor: string;
  bgColor: string;
  glowColor: string;
  ringColor: string;
  animation: string;
  bgGlow: string;
  pulseColor: string;
  glowAnimation: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  intensity: string;
  speed: string;
};

interface StreamingBorderProps {
  streamingConfig: StreamingConfig;
}

/**
 * StreamingBorder renders the multi-layered streaming animation border for ChatInput.
 */
export const StreamingBorder: React.FC<StreamingBorderProps> = ({
  streamingConfig,
}) => (
  <>
    {/* Animated border - flowing gradient */}
    <div
      className={`absolute inset-0 rounded-xl ${streamingConfig.glowAnimation} opacity-90`}
      style={{
        background: `conic-gradient(from 0deg, \
          ${streamingConfig.primaryColor}90 0deg,\
          ${streamingConfig.accentColor}60 60deg,\
          ${streamingConfig.primaryColor}90 120deg,\
          ${streamingConfig.secondaryColor}70 180deg,\
          ${streamingConfig.accentColor}60 240deg,\
          ${streamingConfig.primaryColor}90 300deg,\
          ${streamingConfig.primaryColor}90 360deg)`,
        animationDuration: streamingConfig.speed,
      }}
    />
    {/* Inner content area */}
    <div className="absolute inset-[2px] rounded-xl bg-background" />
    {/* Outer glow layers */}
    <div
      className={`absolute inset-[-3px] rounded-xl ${streamingConfig.glowAnimation} opacity-60`}
      style={{
        background: `conic-gradient(from 0deg, \
          transparent 0deg, \
          ${streamingConfig.primaryColor}30 30deg,\
          ${streamingConfig.accentColor}40 60deg,\
          transparent 90deg,\
          transparent 180deg,\
          ${streamingConfig.secondaryColor}20 210deg,\
          ${streamingConfig.accentColor}30 240deg,\
          transparent 270deg,\
          transparent 360deg)`,
        filter: 'blur(3px)',
        animationDuration: streamingConfig.speed,
      }}
    />
    {/* Secondary rotating glow */}
    <div
      className={`absolute inset-[-6px] rounded-xl ${streamingConfig.glowAnimation} opacity-40`}
      style={{
        background: `conic-gradient(from 180deg, \
          transparent 0deg, \
          ${streamingConfig.accentColor}20 45deg,\
          ${streamingConfig.primaryColor}30 90deg,\
          transparent 135deg,\
          transparent 225deg,\
          ${streamingConfig.secondaryColor}15 270deg,\
          transparent 315deg,\
          transparent 360deg)`,
        filter: 'blur(4px)',
        animationDuration: `calc(${streamingConfig.speed} * 0.7)`,
        animationDirection: 'reverse',
      }}
    />
    {/* Breathing pulse effect */}
    <div
      className="absolute inset-[-2px] rounded-xl animate-breathe opacity-30"
      style={{
        background: `radial-gradient(circle at 50% 50%, \
          ${streamingConfig.primaryColor}15 0%, \
          ${streamingConfig.accentColor}08 50%, \
          transparent 100%)`,
        animationDuration: '2s',
        filter: 'blur(1px)',
      }}
    />
    {/* Shimmer effect on border */}
    <div className="absolute inset-0 rounded-xl overflow-hidden">
      <div
        className="absolute inset-0 animate-shimmer"
        style={{
          background: `linear-gradient(90deg, \
            transparent 0%, \
            ${streamingConfig.accentColor}30 50%, \
            transparent 100%)`,
          animationDuration: '2s',
        }}
      />
    </div>
  </>
);
