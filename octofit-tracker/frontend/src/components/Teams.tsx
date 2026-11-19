import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = {
  name: string;
  mascot?: string;
  members: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch((failure: unknown) => setError(failure instanceof Error ? failure.message : 'Request failed'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      loading={loading}
      emptyText="No teams found."
      isEmpty={teams.length === 0}
      error={error}
    >
      <ul className="list-group">
        {teams.map((team) => (
          <li className="list-group-item" key={team.name}>
            <strong>{team.name}</strong>{team.mascot ? ` - ${team.mascot}` : ''}
            {team.members.length > 0 && <span> - {team.members.join(', ')}</span>}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
