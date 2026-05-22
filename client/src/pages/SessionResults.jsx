import { BarChart3, CheckCircle2, Loader2, MessageSquareHeart, RefreshCw, Send, Wifi, WifiOff, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import ClassBreakdown from '../components/ClassBreakdown';
import LiveResponseFeed from '../components/LiveResponseFeed';
import ReteachSuggestion from '../components/ReteachSuggestion';

const statusBadge = {
  active: 'bg-blue-100 text-blue-700 border-blue-200',
  pending: 'bg-slate-100 text-slate-600 border-slate-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200'
};

const understoodBadge = {
  yes: 'bg-emerald-100 text-emerald-700',
  partial: 'bg-amber-100 text-amber-800',
  no: 'bg-rose-100 text-rose-700'
};

const understoodLabel = { yes: 'Understood', partial: 'Partial', no: 'Struggling' };

const Toast = ({ message, onClose }) => (
  <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-2xl shadow-emerald-100 animate-slide-up">
    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
    <p className="text-sm font-bold text-[#11233f]">{message}</p>
    <button onClick={onClose} className="ml-1 text-slate-400 hover:text-slate-600">
      <X size={14} />
    </button>
  </div>
);

const SessionResults = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [students, setStudents] = useState([]);
  const [replyStudentId, setReplyStudentId] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [analysing, setAnalysing] = useState(false);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [replySending, setReplySending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [sseConnected, setSseConnected] = useState(false);
  const [toast, setToast] = useState('');
  const sseRef = useRef(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(''), 4000);
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const response = await api.get(`/sessions/${sessionId}`);
      const nextSession = response.data.session;
      const teacherId = nextSession.teacherId?._id || nextSession.teacherId;
      setSession(nextSession);
      setMessages(response.data.messages);
      if (teacherId) {
        const studentsRes = await api.get(`/students/${teacherId}`);
        setStudents(studentsRes.data.students || []);
      }
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { loadSession(); }, [loadSession]);

  useEffect(() => {
    if (!sessionId) return;
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const evtSource = new EventSource(`${baseUrl}/api/sessions/${sessionId}/events`);
    sseRef.current = evtSource;

    evtSource.addEventListener('connected', () => setSseConnected(true));

    evtSource.addEventListener('response', (e) => {
      try {
        const data = JSON.parse(e.data);
        setSession((prev) => {
          if (!prev) return prev;
          const prevCount = prev.responses?.length || 0;
          const nextCount = data.responses?.length || 0;
          if (nextCount > prevCount) {
            const newStudent = data.responses[data.responses.length - 1]?.studentId?.name;
            showToast(newStudent ? `New reply from ${newStudent}!` : 'New student response received!');
          }
          return { ...prev, responses: data.responses };
        });
      } catch (_) {}
    });

    evtSource.addEventListener('analysed', (e) => {
      try {
        const data = JSON.parse(e.data);
        setSession((prev) => (prev ? { ...prev, ...data.session } : prev));
        showToast('Analysis complete!');
      } catch (_) {}
    });

    evtSource.onerror = () => setSseConnected(false);

    return () => {
      evtSource.close();
      sseRef.current = null;
      setSseConnected(false);
    };
  }, [sessionId, showToast]);

  useEffect(() => {
    if (session?.status !== 'active' || sseConnected) return undefined;
    const timer = window.setInterval(loadSession, 5000);
    return () => window.clearInterval(timer);
  }, [loadSession, session?.status, sseConnected]);

  const analyze = async () => {
    try {
      setAnalysing(true);
      setError('');
      setNotice('');
      const response = await api.post(`/sessions/${sessionId}/analyze`);
      setSession(response.data.session);
      setNotice('Analysis complete. Personalised feedback sent to students.');
      await loadSession();
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalysing(false);
    }
  };

  const sendFeedback = async () => {
    try {
      setFeedbackSending(true);
      setError('');
      const response = await api.post(`/sessions/${sessionId}/feedback`);
      setNotice(`Feedback sent to ${response.data.sent} students.`);
      await loadSession();
    } catch (err) {
      setError(err.message);
    } finally {
      setFeedbackSending(false);
    }
  };

  const groups = useMemo(() => session?.groupedStudents || { advanced: [], average: [], needsSupport: [] }, [session]);
  const insight = session?.classInsight || {};
  const respondedIds = useMemo(
    () => new Set((session?.responses || []).map((r) => String(r.studentId?._id || r.studentId))),
    [session]
  );
  const pendingStudents = useMemo(
    () => students.filter((s) => !respondedIds.has(String(s._id))),
    [respondedIds, students]
  );

  useEffect(() => {
    if (session?.status !== 'active') return;
    const stillAvail = pendingStudents.some((s) => s._id === replyStudentId);
    if (!stillAvail) setReplyStudentId(pendingStudents[0]?._id || '');
  }, [pendingStudents, replyStudentId, session?.status]);

  const submitMockReply = async () => {
    if (!replyStudentId || !replyBody.trim()) {
      setError('Choose a student and add at least one answer.');
      return;
    }
    try {
      setReplySending(true);
      setError('');
      setNotice('');
      const response = await api.post(`/sessions/${sessionId}/responses`, {
        studentId: replyStudentId,
        body: replyBody
      });
      setSession(response.data.session);
      setMessages(response.data.messages || []);
      setReplyBody('');
      showToast('Student reply captured.');
    } catch (err) {
      setError(err.message);
    } finally {
      setReplySending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 panel rounded-xl p-6">
        <Loader2 size={18} className="animate-spin text-slate-400" />
        <span className="font-semibold text-slate-600">Loading session…</span>
      </div>
    );
  }

  if (!session) {
    return <p className="rounded-xl border border-rose-200 bg-rose-50 p-5 font-semibold text-rose-800">{error || 'Session not found.'}</p>;
  }

  const responseCount = session.responses?.length || 0;
  const totalStudents = students.length;

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}

      <section className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xs font-bold text-blue-600 hover:underline">Dashboard</Link>
            <span className="text-xs text-slate-300">/</span>
            <span className="text-xs text-slate-400">Session</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <h1 className="text-3xl font-black text-[#11233f]">{session.topic}</h1>
            <span className={`rounded-lg border px-2.5 py-1 text-xs font-black uppercase ${statusBadge[session.status] || statusBadge.pending}`}>
              {session.status === 'active' && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-blue-500 align-middle animate-pulse" />}
              {session.status}
            </span>
            {session.status === 'active' && (
              <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-bold ${sseConnected ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                {sseConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
                {sseConnected ? 'Live' : 'Polling'}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {session.teacherId?.name} · {session.grade} · {session.subject} · {session.language}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadSession}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
          >
            <RefreshCw size={15} />
          </button>
          <button
            type="button"
            onClick={analyze}
            disabled={!responseCount || analysing}
            className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#11233f] px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            <BarChart3 size={15} />
            {analysing ? 'Analysing…' : 'Analyse responses'}
          </button>
          <button
            type="button"
            onClick={sendFeedback}
            disabled={!responseCount || feedbackSending}
            className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <MessageSquareHeart size={15} />
            {feedbackSending ? 'Sending…' : 'Send feedback'}
          </button>
        </div>
      </section>

      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 font-semibold text-rose-800">{error}</p>}
      {notice && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <p className="font-semibold text-emerald-800">{notice}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel rounded-xl p-4">
          <p className="text-2xl font-black text-[#11233f]">{responseCount}
            {totalStudents > 0 && <span className="ml-1 text-base font-semibold text-slate-400">/ {totalStudents}</span>}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-500">Responses received</p>
          {totalStudents > 0 && (
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-700"
                style={{ width: `${Math.min(100, Math.round((responseCount / totalStudents) * 100))}%` }}
              />
            </div>
          )}
        </div>
        <div className="panel rounded-xl p-4">
          <p className="text-2xl font-black text-emerald-600">{groups.advanced?.length || 0}</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">Advanced</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-400 transition-all duration-700"
              style={{ width: responseCount ? `${Math.round(((groups.advanced?.length || 0) / responseCount) * 100)}%` : '0%' }} />
          </div>
        </div>
        <div className="panel rounded-xl p-4">
          <p className="text-2xl font-black text-rose-600">{groups.needsSupport?.length || 0}</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">Need support</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-rose-400 transition-all duration-700"
              style={{ width: responseCount ? `${Math.round(((groups.needsSupport?.length || 0) / responseCount) * 100)}%` : '0%' }} />
          </div>
        </div>
      </div>

      {session.status === 'active' && (
        <section className="panel rounded-xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Simulate reply</p>
              <h2 className="mt-1 text-lg font-black text-[#11233f]">Add test response</h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {pendingStudents.length
                  ? `${pendingStudents.length} of ${totalStudents} students yet to reply`
                  : 'All students have replied'}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-1.5 text-sm font-bold text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              Session active
            </span>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_2fr_auto]">
            <label className="grid gap-1.5 text-sm font-bold text-slate-600">
              Student
              <select className="field" value={replyStudentId} onChange={(e) => setReplyStudentId(e.target.value)}>
                {!pendingStudents.length && <option value="">All replied ✓</option>}
                {pendingStudents.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-bold text-slate-600">
              Answers (one per line)
              <textarea
                className="field min-h-20 resize-y"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder={`1. First answer\n2. Second answer\n3. Third answer`}
              />
            </label>
            <button
              type="button"
              onClick={submitMockReply}
              disabled={replySending || !replyStudentId || !replyBody.trim()}
              className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {replySending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Save
            </button>
          </div>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <ClassBreakdown insight={insight} responseCount={responseCount} />
        <ReteachSuggestion insight={insight} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <section className="panel rounded-xl p-5">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">AI class analysis</p>
          <div className="space-y-3">
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-4">
              <p className="text-xs font-black uppercase text-rose-600 mb-1.5">Common misconception</p>
              <p className="text-sm leading-6 text-rose-900">{insight.commonMistake || 'Run analysis to surface misconceptions.'}</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
              <p className="text-xs font-black uppercase text-amber-600 mb-1.5">Recurring pattern</p>
              <p className="text-sm leading-6 text-amber-900">{insight.recurringMisconception || 'Patterns appear after multiple sessions.'}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-xs font-black uppercase text-slate-400 mb-1.5">Teacher summary</p>
              <p className="text-sm leading-6 text-slate-700">{insight.teacherSummary || 'Analyse responses to generate classroom summary.'}</p>
            </div>
          </div>
        </section>

        <LiveResponseFeed
          responses={session.responses}
          messages={messages}
          isLive={sseConnected}
        />
      </section>

      {responseCount > 0 && (
        <section>
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Student breakdown</p>
          <div className="grid gap-4 xl:grid-cols-3">
            {[
              { label: 'Advanced', key: 'advanced', color: 'text-emerald-700', border: 'border-emerald-200', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
              { label: 'Average', key: 'average', color: 'text-amber-700', border: 'border-amber-200', bg: 'bg-amber-50', dot: 'bg-amber-500' },
              { label: 'Needs support', key: 'needsSupport', color: 'text-rose-700', border: 'border-rose-200', bg: 'bg-rose-50', dot: 'bg-rose-500' }
            ].map(({ label, key, color, border, bg, dot }) => (
              <section key={label} className={`rounded-xl border ${border} ${bg} p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${dot}`} />
                    <h3 className={`font-black text-sm ${color}`}>{label}</h3>
                  </div>
                  <span className="rounded-lg bg-white/70 px-2 py-0.5 text-sm font-black text-slate-600">
                    {groups[key]?.length || 0}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {!groups[key]?.length && (
                    <p className="text-xs text-slate-400 py-2">Analyse responses to populate.</p>
                  )}
                  {(groups[key] || []).map((student) => (
                    <Link
                      key={student.studentId || student._id}
                      to={`/students/${student.studentId || student._id}`}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm transition hover:bg-white"
                    >
                      <span className="font-semibold text-[#11233f] truncate">{student.name}</span>
                      <span className={`text-xs font-black shrink-0 ${color}`}>{student.score || 0}%</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default SessionResults;
