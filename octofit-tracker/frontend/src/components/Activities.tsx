import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = {
  type: string;
  minutes: number;
  points: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => setActivities(data.activities))
      .catch((failure: unknown) => setError(failure instanceof Error ? failure.message : 'Request failed'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      loading={loading}
      emptyText="No activities found."
      isEmpty={activities.length === 0}
      error={error}
    >
      <ul className="list-group">
        {activities.map((activity, index) => (
          <li className="list-group-item" key={`${activity.type}-${index}`}>
            {activity.type} - {activity.minutes} minutes - {activity.points} points
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
