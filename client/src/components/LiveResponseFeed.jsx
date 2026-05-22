import { MessageCircleMore } from 'lucide-react';

const LiveResponseFeed = ({ responses = [], messages = [] }) => {
  const acknowledgementCount = messages.filter((message) => message.type === 'acknowledgement').length;

  return (
    <section className="panel rounded-lg p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase text-slate-500">Live feed</p>
          <h2 className="mt-1 text-xl font-black">Student replies</h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
          <MessageCircleMore size={17} aria-hidden="true" />
          {acknowledgementCount} acknowledged
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {!responses.length && (
          <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Responses will appear here as WhatsApp replies reach the active session.
          </p>
        )}
        {responses.slice().reverse().map((response) => (
          <article key={`${response.studentId?._id || response.studentId}-${response.submittedAt}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-black">{response.studentId?.name || 'Student'}</p>
              <time className="text-xs font-semibold text-slate-500">
                {response.submittedAt ? new Date(response.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
              </time>
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              {(response.answers || []).map((answer, index) => (
                <p key={`${answer}-${index}`} className="rounded-md bg-white px-3 py-2">
                  <span className="font-bold text-slate-400">A{index + 1}</span> {answer}
                </p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default LiveResponseFeed;
