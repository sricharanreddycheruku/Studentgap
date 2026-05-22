import { ClipboardCheck } from 'lucide-react';

const TeacherInsights = ({ insight, weakTopic, improvedStudent }) => (
  <section className="panel rounded-lg p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-bold uppercase text-slate-500">AI teacher insight</p>
        <h2 className="mt-1 text-xl font-black">Next classroom move</h2>
      </div>
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-100 text-cyan-800">
        <ClipboardCheck size={19} aria-hidden="true" />
      </span>
    </div>
    <p className="mt-4 min-h-20 rounded-lg bg-slate-50 p-4 leading-7 text-slate-700">
      {insight?.teacherSummary || 'Run a diagnostic session to surface misconceptions and get an intervention summary.'}
    </p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-slate-200 p-3">
        <p className="text-sm font-semibold text-slate-500">Weak topic tracker</p>
        <p className="mt-2 font-black">{weakTopic?.topicName || 'No recurring weak topic yet'}</p>
        <p className="text-sm text-slate-500">{weakTopic?.affectedStudents ? `${weakTopic.affectedStudents} students flagged` : 'Start with a quick check'}</p>
      </div>
      <div className="rounded-lg border border-slate-200 p-3">
        <p className="text-sm font-semibold text-slate-500">Most improved</p>
        <p className="mt-2 font-black">{improvedStudent?.name || 'Progress will appear here'}</p>
        <p className="text-sm text-slate-500">{improvedStudent ? `+${improvedStudent.improvement} score points` : 'After two sessions per student'}</p>
      </div>
    </div>
  </section>
);

export default TeacherInsights;
