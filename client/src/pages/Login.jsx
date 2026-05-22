import { ArrowRight, BookOpen, Brain, CheckCircle, Loader2, MessageCircle, Plus, Smartphone, Users, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const emptyTeacher = {
  name: '',
  school: '',
  subject: 'Mathematics',
  grade: 'Class 6',
  language: 'English',
  phone: ''
};

const LANGUAGES = ['English', 'Hindi', 'Telugu', 'Marathi', 'Tamil'];

const features = [
  { icon: MessageCircle, label: 'WhatsApp delivery', desc: 'No app downloads needed' },
  { icon: Brain, label: 'AI gap detection', desc: 'Misconceptions surfaced instantly' },
  { icon: Zap, label: 'Ready in 5 minutes', desc: 'From question to insight' },
  { icon: Users, label: 'Every student heard', desc: 'Even in large classrooms' }
];

const Login = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState(localStorage.getItem('classpulse-teacher') || '');
  const [form, setForm] = useState(emptyTeacher);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedTeacher = useMemo(
    () => teachers.find((t) => t._id === teacherId),
    [teacherId, teachers]
  );

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const response = await api.get('/teachers');
        const teacherList = response.data.teachers || [];
        const savedId = localStorage.getItem('classpulse-teacher') || '';
        const nextId = teacherList.some((t) => t._id === savedId)
          ? savedId
          : teacherList[0]?._id || '';
        setTeachers(teacherList);
        setTeacherId(nextId);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadTeachers();
  }, []);

  const enterWorkspace = () => {
    if (!teacherId) { setError('Choose or create a teacher profile.'); return; }
    localStorage.setItem('classpulse-teacher', teacherId);
    navigate('/');
  };

  const createTeacher = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError('');
      const response = await api.post('/teachers', form);
      const teacher = response.data.teacher;
      setTeachers((curr) => [teacher, ...curr]);
      setTeacherId(teacher._id);
      localStorage.setItem('classpulse-teacher', teacher._id);
      navigate('/roster');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateForm = (field, value) => setForm((curr) => ({ ...curr, [field]: value }));

  return (
    <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-6 py-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl bg-[#11233f] p-8 text-white shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/20 text-blue-300">
            <BookOpen size={20} />
          </span>
          <span className="text-sm font-black uppercase tracking-wider text-blue-300">ClassPulse</span>
        </div>

        <h1 className="mt-6 text-4xl font-black leading-tight lg:text-5xl">
          Diagnose gaps.<br />
          <span className="text-blue-400">Message instantly.</span><br />
          Improve together.
        </h1>

        <p className="mt-4 text-base leading-7 text-slate-300">
          Send diagnostic MCQs via WhatsApp, collect student responses in real time, and get AI-powered insights — all before your next class.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3 rounded-xl bg-white/8 p-4">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-500/20 text-blue-300">
                <Icon size={16} />
              </span>
              <div>
                <p className="text-sm font-black text-white">{label}</p>
                <p className="mt-0.5 text-xs text-slate-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-6 border-t border-white/10 pt-6 text-sm">
          {['5 min setup', 'Multi-language', 'Works offline', 'Zero cost per SMS'].map((tag) => (
            <span key={tag} className="flex items-center gap-2 text-slate-300">
              <CheckCircle size={14} className="text-emerald-400 shrink-0" />
              {tag}
            </span>
          ))}
        </div>
      </section>

      <section className="panel rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-100 text-blue-700">
            <Smartphone size={20} />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Teacher workspace</p>
            <h2 className="text-2xl font-black text-[#11233f]">Enter workspace</h2>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">{error}</p>
        )}

        <div className="mt-6 grid gap-3">
          {loading ? (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Loader2 size={18} className="animate-spin text-slate-400" />
              <span className="text-sm text-slate-500">Loading profiles...</span>
            </div>
          ) : (
            <>
              <select
                className="field"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
              >
                {!teachers.length && <option value="">No teachers yet — create one below</option>}
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>{t.name} · {t.grade} · {t.school}</option>
                ))}
              </select>

              {selectedTeacher && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-black text-[#11233f]">{selectedTeacher.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedTeacher.school} · {selectedTeacher.subject} · {selectedTeacher.language}
                  </p>
                </div>
              )}
            </>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={enterWorkspace}
              disabled={loading || !teacherId}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : <ArrowRight size={17} />}
              Continue
            </button>
            <button
              type="button"
              onClick={() => { setShowCreate((v) => !v); setError(''); }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 font-black text-slate-700 transition hover:bg-slate-100"
            >
              <Plus size={17} />
              New teacher
            </button>
          </div>
        </div>

        {showCreate && (
          <form onSubmit={createTeacher} className="mt-5 grid gap-3 border-t border-slate-200 pt-5">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Create teacher profile</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="field"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                required
                placeholder="Full name"
              />
              <input
                className="field"
                value={form.school}
                onChange={(e) => updateForm('school', e.target.value)}
                required
                placeholder="School name"
              />
              <input
                className="field"
                value={form.subject}
                onChange={(e) => updateForm('subject', e.target.value)}
                required
                placeholder="Subject (e.g. Mathematics)"
              />
              <input
                className="field"
                value={form.grade}
                onChange={(e) => updateForm('grade', e.target.value)}
                required
                placeholder="Grade (e.g. Class 8)"
              />
              <select
                className="field"
                value={form.language}
                onChange={(e) => updateForm('language', e.target.value)}
              >
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
              <input
                className="field"
                value={form.phone}
                onChange={(e) => updateForm('phone', e.target.value)}
                placeholder="WhatsApp number (optional)"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#11233f] px-5 font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />}
              Create & continue
            </button>
          </form>
        )}
      </section>
    </div>
  );
};

export default Login;
