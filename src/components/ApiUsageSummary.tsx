"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Zap, Search } from "lucide-react";
import { useUsageTracking } from "@/hooks/useUsageTracking";

export function ApiUsageSummary() {
  const { bonzai, brave, loading, error } = useUsageTracking();

  if (loading) {
    return (
      <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/20 dark:to-slate-900/20 border-slate-200 dark:border-slate-800">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2"></div>
          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-full mb-2"></div>
          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800">
        <div className="text-center text-red-700 dark:text-red-300">
          <Activity className="h-6 w-6 mx-auto mb-2" />
          <span className="text-sm font-medium">Usage Data Unavailable</span>
        </div>
      </Card>
    );
  }

  const bravePercent = brave
    ? Math.round((brave.requestsThisMonth / brave.monthlyLimit) * 100)
    : 0;

  const isAnyNearLimit = bravePercent > 80;

  return (
    <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/20 dark:to-slate-900/20 border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center">
            <Activity className="h-3 w-3 text-white" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
            API Usage Overview
          </span>
        </div>
        <Badge
          variant={isAnyNearLimit ? "destructive" : "secondary"}
          className="text-xs"
        >
          {isAnyNearLimit ? "Monitor" : "Normal"}
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Bonzai Summary */}
        {bonzai && (
          <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                Bonzai
              </span>
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-700 dark:text-blue-300">
                {bonzai.totalRequests} total requests
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                {Math.round(
                  (bonzai.totalInputTokens + bonzai.totalOutputTokens) / 1000
                )}
                k total tokens
              </div>
            </div>
          </div>
        )}

        {/* Brave Summary */}
        {brave && (
          <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-950/30 rounded border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-medium text-orange-800 dark:text-orange-200">
                Brave
              </span>
            </div>
            <div className="text-right">
              <div className="text-xs text-orange-700 dark:text-orange-300">
                {brave.requestsThisMonth}/{brave.monthlyLimit} searches
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400">
                {brave.requestsRemaining} remaining
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
