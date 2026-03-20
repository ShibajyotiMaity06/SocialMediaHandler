// components/PPSBadge.jsx

export default function PPSBadge({ pps }) {
  const colorClass = {
    Strong: 'bg-green-100 text-green-800 border-green-300',
    Moderate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Weak: 'bg-red-100 text-red-800 border-red-300',
  }[pps.category];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 ${colorClass}`}>
      <span className="text-2xl font-bold">{pps.score}</span>
      <span className="text-sm font-medium">{pps.category}</span>
    </div>
  );
}