"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, AlertTriangle } from "lucide-react";
import { BraveUsage } from "@/app/api/brave-usage/route";

export function BraveUsageIndicator() {
  const [usage, setUsage] = useState<BraveUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsage();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await fetch("/api/brave-usage");
      if (response.ok) {
        const data = await response.json();
        setUsage(data.usage);
        setError(null);
      } else {
        setError("Failed to fetch usage data");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
        <div className="animate-pulse">
          <div className="h-4 bg-orange-200 dark:bg-orange-800 rounded w-3/4 mb-2"></div>
          <div className="h-2 bg-orange-200 dark:bg-orange-800 rounded w-full mb-2"></div>
          <div className="h-2 bg-orange-200 dark:bg-orange-800 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (error || !usage) {
    return (
      <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">Brave Search Unavailable</span>
        </div>
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
      </Card>
    );
  }

  const usagePercent = Math.round(
    (usage.requestsThisMonth / usage.monthlyLimit) * 100
  );
  const isNearLimit = usagePercent > 80;
  const timeUntilReset =
    new Date(usage.nextReset).getTime() - new Date().getTime();
  const daysUntilReset = Math.ceil(timeUntilReset / (1000 * 60 * 60 * 24));

  return (
    <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
            <Search className="h-3 w-3 text-white" />
          </div>
          <span className="font-semibold text-orange-900 dark:text-orange-100 text-sm">
            Brave Search Usage
          </span>
        </div>
        <Badge
          variant={isNearLimit ? "destructive" : "secondary"}
          className="text-xs"
        >
          {isNearLimit ? "Near Limit" : "Tracking"}
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Monthly Requests Usage */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-orange-800 dark:text-orange-200">
              Monthly Searches
            </span>
            <span className="text-xs text-orange-700 dark:text-orange-300">
              {usage.requestsThisMonth.toLocaleString()} /{" "}
              {usage.monthlyLimit.toLocaleString()}
            </span>
          </div>
          <div className="relative">
            <Progress
              value={usagePercent}
              className="h-2 bg-orange-200/50 dark:bg-orange-800/30"
            />
            <div
              className="absolute inset-0 h-2 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all"
              style={{
                width: `${usagePercent}%`,
                maxWidth: "100%",
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-orange-600 dark:text-orange-400">
              {usage.requestsRemaining.toLocaleString()} remaining
            </span>
            <span className="text-xs text-orange-600 dark:text-orange-400">
              {usagePercent}%
            </span>
          </div>
        </div>

        {/* Reset Timer */}
        <div className="flex items-center gap-2 pt-2 border-t border-orange-200 dark:border-orange-800">
          <Calendar className="h-3 w-3 text-orange-600 dark:text-orange-400" />
          <span className="text-xs text-orange-600 dark:text-orange-400">
            Resets in {daysUntilReset} day{daysUntilReset !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </Card>
  );
}
