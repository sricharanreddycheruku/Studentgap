import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const tones = {
  medium: 'bg-amber-100 text-amber-900',
  high: 'bg-rose-100 text-rose-800'
};

const RiskStudents = ({ students = [] }) => (
  <section className="panel rounded-lg p-5">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-bold uppercase text-slate-500">Early alerts</p>
        <h2 className="mt-1 text-xl font-black">Students to check in</h2>
      </div>
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-rose-100 text-rose-700">
        <AlertTriangle size={19} aria-hidden="true" />
      </span>
    </div>
    <div className="mt-4 space-y-3">
      {!students.length && <p className="rounded-lg bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">No medium or high risk flags right now.</p>}
      {students.slice(0, 6).map((student) => (
        <Link
          key={student._id}
          to={`/students/${student._id}`}
          className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-blue-200 hover:bg-blue-50"
        >
          <span className="min-w-0">
            <span className="block truncate font-black">{student.name}</span>
            <span className="block text-sm text-slate-500">{student.learningProfile?.weakTopics?.[0] || 'Needs a fresh check-in'}</span>
          </span>
          <span className={`rounded-md px-2 py-1 text-xs font-black uppercase ${tones[student.riskLevel]}`}>{student.riskLevel}</span>
        </Link>
      ))}
    </div>
  </section>
);

export default RiskStudents;
