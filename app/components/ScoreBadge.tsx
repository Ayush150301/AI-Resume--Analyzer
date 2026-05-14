import React from 'react'

const ScoreBadge = ({ score }: { score: number }) => {
  const bg = score > 69 ? 'bg-green-100' : score > 49 ? 'bg-yellow-100' : 'bg-red-100';
  const text = score > 69 ? 'text-green-600' : score > 49 ? 'text-yellow-600' : 'text-red-600';
  const label = score > 69 ? 'Strong' : score > 49 ? 'Good Start' : 'Needs Work';

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full ${bg}`}>
      <p className={`text-sm font-semibold ${text}`}>{label}</p>
    </div>
  );
}

export default ScoreBadge