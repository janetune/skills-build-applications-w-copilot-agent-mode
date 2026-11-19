import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Workout = {
  title: string;
  focus?: string;
  reason: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userEmail = 'mona@example.com';
    getJson<{ suggestions: Workout[] }>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`)
      .then((data) => setSuggestions(data.suggestions))
      .catch((failure: unknown) => setError(failure instanceof Error ? failure.message : 'Request failed'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loading={loading}
      emptyText="No workout suggestions found."
      isEmpty={suggestions.length === 0}
      error={error}
    >
      <ul className="list-group">
        {suggestions.map((suggestion) => (
          <li className="list-group-item" key={suggestion.title}>
            <strong>{suggestion.title}</strong>
            {suggestion.reason && <span> - {suggestion.reason}</span>}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
