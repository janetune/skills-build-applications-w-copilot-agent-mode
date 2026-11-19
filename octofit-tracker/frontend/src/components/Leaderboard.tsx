import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Ranking = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ leaderboard: Ranking[] }>('/api/leaderboard')
      .then((data) => setRankings(data.leaderboard))
      .catch((failure: unknown) => setError(failure instanceof Error ? failure.message : 'Request failed'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      loading={loading}
      emptyText="No leaderboard rankings found."
      isEmpty={rankings.length === 0}
      error={error}
    >
      <ol className="list-group list-group-numbered">
        {rankings.map((ranking) => (
          <li className="list-group-item" key={ranking.teamName}>
            {ranking.teamName} - {ranking.totalPoints} points
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
