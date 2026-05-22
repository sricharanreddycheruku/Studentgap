import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const ProgressChart = ({ history = [] }) => {
  const data = history.map((item) => ({
    topic: item.topic,
    score: item.score,
    date: new Date(item.date).toLocaleDateString([], { day: '2-digit', month: 'short' })
  }));

  return (
    <section className="panel rounded-lg p-5">
      <p className="text-sm font-bold uppercase text-slate-500">Score trend</p>
      <h2 className="mt-1 text-xl font-black">Progress chart</h2>
      <div className="chart-shell mt-4">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 10, left: -20, bottom: 8 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#dbe5f0" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 5, fill: '#0f766e' }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="grid h-full place-items-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">Scores appear after a diagnostic check.</p>}
      </div>
    </section>
  );
};

export default ProgressChart;
