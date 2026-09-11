interface TotalCheckInsProps {
  count: number;
}

export function TotalCheckIns({ count }: TotalCheckInsProps) {
  return (
    <div className="rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-2">
      <p className="text-xs text-cyan-700">Total Check-ins</p>
      <p className="text-2xl font-bold text-cyan-900">{count} 📊</p>
    </div>
  );
}
