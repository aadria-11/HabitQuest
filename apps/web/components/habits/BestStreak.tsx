interface BestStreakProps {
  best: number;
}

export function BestStreak({ best }: BestStreakProps) {
  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-2">
      <p className="text-xs text-purple-700">Best Streak</p>
      <p className="text-2xl font-bold text-purple-900">{best} days ⭐</p>
    </div>
  );
}
