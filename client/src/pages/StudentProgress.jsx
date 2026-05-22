import { ArrowLeft, BadgeCheck, MessageCircleHeart, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import ProgressChart from '../charts/ProgressChart';
import StudentTimeline from '../components/StudentTimeline';

const riskBadge = {
  low: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-amber-100 text-amber-900',
  high: 'bg-rose-100 text-rose-800'
};

const confidenceBadge = {
  high: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-rose-50 text-rose-700 border-rose-200'
};

const StudentProgress = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get(`/students/progress/${studentId}`);
        setStudent(response.data.student);
        setMessages(response.data.messages || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  const confidenceTrend = useMemo(
    () => (student?.progressHistory || []).slice().reverse().slice(0, 6),
    [student]
  );

  const feedbackMessages = useMemo(
    () => messages.filter((m) => m.type === 'feedback').slice(0, 5),
    [messages]
  );

  const latestScore = student?.progressHistory?.at(-1)?.score ?? null;
  const sessionCount = student?.progressHistory?.length || 0;
  const avgScore = sessionCount
    ? Math.round(student.progressHistory.reduce((sum, e) => sum + (e.score || 0), 0) / sessionCount)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center gap-3 panel rounded-xl p-6">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
        <span className="font-semibold text-slate-600">Loading student profile...</span>
      </div>
    );
  }

  if (!student) {
    return <p className="rounded-xl border border-rose-200 bg-rose-50 p-5 font-semibold text-rose-800">{error || 'Student not found.'}</p>;
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline">
            <ArrowLeft size={13} />
            Dashboard
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black text-[#11233f]">{student.name}</h1>
            <span className={`rounded-lg px-2 py-1 text-xs font-black uppercase ${riskBadge[student.riskLevel] || riskBadge.low}`}>
              {student.riskLevel} risk
            </span>
            <span className={`rounded-lg border px-2 py-1 text-xs font-black ${confidenceBadge[student.confidenceLevel] || confidenceBadge.medium}`}>
              {student.confidenceLevel} confidence
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {student.grade} · {student.teacherId?.name} · {student.teacherId?.school}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Sessions', value: sessionCount },
            { label: 'Avg score', value: `${avgScore}%` },
            { label: 'Latest', value: latestScore !== null ? `${latestScore}%` : '–' }
          ].map(({ label, value }) => (
            <div key={label} className="panel rounded-xl p-4 text-center min-w-[80px]">
              <p className="text-2xl font-black text-[#11233f]">{value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <ProgressChart history={student.progressHistory} />

        <section className="panel rounded-xl p-5">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Learning profile</p>

          <div className="space-y-3">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
              <p className="text-xs font-black uppercase text-emerald-700 mb-2">Strong topics</p>
              <div className="flex flex-wrap gap-2">
                {student.learningProfile?.strongTopics?.length
                  ? student.learningProfile.strongTopics.map((t) => (
                    <span key={t} className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">{t}</span>
                  ))
                  : <span className="text-xs text-emerald-700">Builds with session history</span>
                }
              </div>
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
              <p className="text-xs font-black uppercase text-amber-700 mb-2">Weak topics</p>
              <div className="flex flex-wrap gap-2">
                {student.learningProfile?.weakTopics?.length
                  ? student.learningProfile.weakTopics.map((t) => (
                    <span key={t} className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900">{t}</span>
                  ))
                  : <span className="text-xs text-amber-700">No recurring weak topic yet</span>
                }
              </div>
            </div>

            <div className="rounded-xl bg-rose-50 border border-rose-100 p-4">
              <p className="text-xs font-black uppercase text-rose-700 mb-2">Recurring mistakes</p>
              <div className="space-y-1.5">
                {student.learningProfile?.recurringMistakes?.length
                  ? student.learningProfile.recurringMistakes.map((m) => (
                    <p key={m} className="rounded-lg bg-white/70 px-3 py-2 text-xs text-rose-900">{m}</p>
                  ))
                  : <p className="text-xs text-rose-700">No repeated mistake recorded</p>
                }
              </div>
            </div>
          </div>
        </section>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <StudentTimeline history={student.progressHistory} />

        <section className="panel rounded-xl p-5 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BadgeCheck size={17} className="text-blue-600" />
              <h2 className="font-black text-[#11233f]">Confidence trend</h2>
            </div>
            {!confidenceTrend.length && (
              <p className="text-sm text-slate-500">Confidence signals arrive after AI analysis.</p>
            )}
            <div className="flex flex-wrap gap-2">
              {confidenceTrend.map((item, i) => (
                <div
                  key={i}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                    confidenceBadge[item.confidenceLevel] || confidenceBadge.medium
                  }`}
                >
                  <span className="block">{item.topic}</span>
                  <span className="capitalize opacity-80">{item.confidenceLevel}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircleHeart size={17} className="text-emerald-600" />
              <h2 className="font-black text-[#11233f]">Feedback history</h2>
            </div>
            {!feedbackMessages.length && (
              <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center">
                <TrendingUp size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">No WhatsApp feedback yet</p>
                <p className="mt-0.5 text-xs text-slate-400">Feedback is sent after session analysis</p>
              </div>
            )}
            <div className="space-y-3">
              {feedbackMessages.map((msg) => (
                <article key={msg._id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-black uppercase ${
                      msg.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>{msg.deliveryMode} · {msg.status}</span>
                    <span className="text-xs text-slate-400">{new Date(msg.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs leading-5 text-slate-700">{msg.content}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>
    </div>
  );
};

export default StudentProgress;
