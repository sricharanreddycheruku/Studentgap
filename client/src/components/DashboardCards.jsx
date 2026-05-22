import { BookCheck, Clock3, GraduationCap, TrendingUp } from 'lucide-react';

const cards = (dashboard) => [
  { label: 'Students', value: dashboard.totalStudents || 0, note: 'Roster linked to this teacher', icon: GraduationCap, tone: 'bg-blue-100 text-blue-700' },
  { label: 'Sessions this week', value: dashboard.sessionsThisWeek || 0, note: 'Recent diagnostic checks', icon: BookCheck, tone: 'bg-emerald-100 text-emerald-700' },
  { label: 'Average understanding', value: `${dashboard.averageUnderstanding || 0}%`, note: 'Across analysed responses', icon: TrendingUp, tone: 'bg-amber-100 text-amber-800' },
  { label: 'Time saved', value: `${Math.round((dashboard.estimatedMinutesSaved || 0) / 60 * 10) / 10}h`, note: `${dashboard.estimatedMinutesSaved || 0} grading minutes`, icon: Clock3, tone: 'bg-rose-100 text-rose-700' }
];

const DashboardCards = ({ dashboard }) => (
  <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Teacher dashboard summary">
    {cards(dashboard).map(({ label, value, note, icon: Icon, tone }) => (
      <article key={label} className="panel rounded-lg p-5 transition hover:-translate-y-1 hover:shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-black text-[#11233f]">{value}</p>
          </div>
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${tone}`}>
            <Icon size={21} aria-hidden="true" />
          </span>
        </div>
        <p className="mt-4 text-sm text-slate-500">{note}</p>
      </article>
    ))}
  </section>
);

export default DashboardCards;
