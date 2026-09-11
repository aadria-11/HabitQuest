interface StreakBadgeProps {
  current: number;
}

export function StreakBadge({ current }: StreakBadgeProps) {
  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2">
      <p className="text-xs text-yellow-700">Current Streak</p>
      <p className="text-2xl font-bold text-yellow-900">{current} 🔥</p>
    </div>
  );
}
