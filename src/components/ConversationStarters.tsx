"use client";

import { Sparkles, RefreshCw } from "lucide-react";
import { ConversationStarter } from "@/hooks/useConversationStarters";
import { Button } from "@/components/ui/button";

interface ConversationStartersProps {
  starters: ConversationStarter[];
  isLoading: boolean;
  onStarterClick: (prompt: string) => void;
  onRefresh: () => void;
}

export function ConversationStarters({
  starters,
  isLoading,
  onStarterClick,
  onRefresh,
}: ConversationStartersProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles
            className={`h-5 w-5 text-blue-500 ${
              isLoading ? "animate-pulse" : ""
            }`}
          />
          <h3 className="text-lg font-semibold text-foreground">
            {isLoading
              ? "Generating Conversation Starters"
              : "Conversation Starters"}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Show existing starters that have streamed in */}
        {starters.map((starter, index) => (
          <button
            key={starter.id}
            onClick={() => onStarterClick(starter.prompt)}
            className="group relative p-4 bg-card border border-border rounded-xl hover:border-blue-500/50 hover:bg-card/80 transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-full opacity-0 animate-fade-in"
            style={{
              animationDelay: `${index * 100}ms`,
              animationFillMode: "both",
            }}
          >
            <div className="flex items-start gap-3 h-full">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 group-hover:bg-blue-400 transition-colors" />
              <div className="flex-1 min-w-0 flex flex-col justify-start">
                <h4 className="font-medium text-foreground group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">
                  {starter.title}
                </h4>
                <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">
                  {starter.prompt}
                </p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </button>
        ))}

        {/* Show placeholder slots for remaining starters while loading */}
        {isLoading &&
          Array.from({ length: Math.max(0, 6 - starters.length) }).map(
            (_, index) => (
              <div
                key={`placeholder-${index}`}
                className="h-24 bg-muted/30 rounded-xl border border-border/30 animate-pulse"
                style={{
                  animationDelay: `${(starters.length + index) * 200}ms`,
                }}
              />
            )
          )}
      </div>
    </div>
  );
}
