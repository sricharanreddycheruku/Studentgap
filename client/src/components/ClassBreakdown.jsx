const buckets = [
  { key: 'understoodCount', label: 'Understood', tone: 'bg-emerald-500', surface: 'bg-emerald-50 text-emerald-800' },
  { key: 'partialCount', label: 'Partial', tone: 'bg-amber-400', surface: 'bg-amber-50 text-amber-900' },
  { key: 'strugglingCount', label: 'Struggling', tone: 'bg-rose-500', surface: 'bg-rose-50 text-rose-800' }
];

const ClassBreakdown = ({ insight = {}, responseCount = 0 }) => {
  const total = Math.max(responseCount, buckets.reduce((sum, bucket) => sum + Number(insight[bucket.key] || 0), 0), 1);

  return (
    <section className="panel rounded-lg p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase text-slate-500">Class breakdown</p>
          <h2 className="mt-1 text-xl font-black">Response understanding</h2>
        </div>
        <p className="text-sm text-slate-500">{responseCount} live responses</p>
      </div>
      <div className="mt-5 flex h-4 overflow-hidden rounded-full bg-slate-100" aria-label="Understanding breakdown">
        {buckets.map((bucket) => (
          <span
            key={bucket.key}
            className={bucket.tone}
            style={{ width: `${(Number(insight[bucket.key] || 0) / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {buckets.map((bucket) => (
          <div key={bucket.key} className={`rounded-lg p-3 ${bucket.surface}`}>
            <p className="text-sm font-bold">{bucket.label}</p>
            <p className="mt-1 text-2xl font-black">{insight[bucket.key] || 0}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ClassBreakdown;
