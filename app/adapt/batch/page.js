import BatchAdaptationDashboard from '@/components/BatchAdaptationDashboard';

function normalizeIds(rawIds) {
  const fromParam = String(rawIds || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  const seen = new Set();
  const ids = [];

  for (const id of fromParam) {
    if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length === 3) break;
  }

  return ids;
}

export default async function BatchAdaptPage({ searchParams }) {
  const params = await searchParams;
  const videoIds = normalizeIds(params?.videoIds);

  return (
    <div className="flex-grow flex flex-col pt-4">
      <BatchAdaptationDashboard initialVideoIds={videoIds} />
    </div>
  );
}
