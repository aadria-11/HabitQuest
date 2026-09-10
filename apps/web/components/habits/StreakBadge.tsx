interface StreakBadgeProps {
  current: number;
  best: number;
}

export function StreakBadge({ current, best }: StreakBadgeProps) {
  return (
    <div className="flex gap-4">
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2">
        <p className="text-xs text-yellow-700">Current Streak</p>
        <p className="text-2xl font-bold text-yellow-900">{current} 🔥</p>
      </div>
      <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-2">
        <p className="text-xs text-purple-700">Best Streak</p>
        <p className="text-2xl font-bold text-purple-900">{best} ⭐</p>
      </div>
    </div>
  );
}
