import { CheckCircle2, ClipboardCopy, ExternalLink, MessageCircleMore, RefreshCw, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';

const Signal = ({ label, ready, detail }) => (
  <div className={`flex items-center justify-between rounded-xl border p-4 transition ${
    ready ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
  }`}>
    <div>
      <p className={`font-black text-sm ${ready ? 'text-emerald-800' : 'text-amber-900'}`}>{label}</p>
      {detail && <p className={`mt-0.5 text-xs ${ready ? 'text-emerald-600' : 'text-amber-700'}`}>{detail}</p>}
    </div>
    {ready
      ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
      : <TriangleAlert size={18} className="text-amber-500 shrink-0" />
    }
  </div>
);

const Step = ({ num, title, children }) => (
  <div className="flex gap-4">
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#11233f] text-xs font-black text-white mt-0.5">{num}</span>
    <div className="min-w-0 pb-5 border-b border-slate-100 last:border-0 w-full">
      <h3 className="font-black text-[#11233f] text-sm">{title}</h3>
      <div className="mt-2 text-sm leading-6 text-slate-600 space-y-2">{children}</div>
    </div>
  </div>
);

const WhatsAppSetup = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/system/status');
      setStatus(response.data.status);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const copyWebhook = async () => {
    if (!status?.webhookUrl) return;
    try {
      await navigator.clipboard.writeText(status.webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-blue-600">WhatsApp</p>
          <h1 className="mt-1 text-3xl font-black text-[#11233f]">WhatsApp setup</h1>
          <p className="mt-1 text-sm text-slate-500">
            Using <strong>Green API</strong> — free WhatsApp delivery via QR scan. No paid plan needed.
          </p>
        </div>
        <button
          type="button"
          onClick={loadStatus}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <RefreshCw size={15} />
          Refresh status
        </button>
      </section>

      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 font-semibold text-rose-800">{error}</p>}

      {loading && (
        <div className="grid gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {!loading && status && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Signal label="API server" detail="Backend online" ready={status.api === 'online'} />
            <Signal label="Database" detail="PostgreSQL connected" ready={status.database} />
            <Signal
              label="AI (Gemini)"
              detail={status.geminiConfigured ? 'Gemini 2.5 Flash ready' : 'GEMINI_API_KEY missing'}
              ready={status.geminiConfigured}
            />
            <Signal
              label="Green API"
              detail={status.greenApiConfigured ? 'Instance configured' : 'Credentials missing'}
              ready={status.greenApiConfigured}
            />
          </section>

          {status.whatsappMode === 'mock' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-black text-amber-800">Mock mode active</p>
              <p className="mt-1 text-sm text-amber-700">
                Messages are logged but not sent to real phones. Set <code className="rounded bg-amber-100 px-1">USE_MOCK_WHATSAPP=false</code> and add Green API credentials to enable real delivery.
              </p>
            </div>
          )}

          {status.greenApiConfigured && status.whatsappMode !== 'mock' && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              <div>
                <p className="font-black text-emerald-800">Green API is active!</p>
                <p className="mt-0.5 text-sm text-emerald-700">
                  Real WhatsApp messages are being sent and received.
                </p>
              </div>
            </div>
          )}

          <section className="grid gap-5 xl:grid-cols-[1fr_1.4fr]">
            <div className="panel rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                  <MessageCircleMore size={18} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Webhook URL</p>
                  <h2 className="font-black text-[#11233f] text-sm">Paste in Green API dashboard</h2>
                </div>
              </div>

              <div className="relative">
                <p className="break-all rounded-xl bg-[#11233f] p-4 pr-12 font-mono text-xs text-emerald-300 leading-6">
                  {status.webhookUrl}
                </p>
                <button
                  type="button"
                  onClick={copyWebhook}
                  className={`absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg transition ${
                    copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  title="Copy URL"
                >
                  {copied ? <CheckCircle2 size={15} /> : <ClipboardCopy size={15} />}
                </button>
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-500">
                <p>· Green API Dashboard → Instance → <strong>Notifications</strong></p>
                <p>· Paste URL in <strong>Webhook</strong> field</p>
                <p>· Enable <strong>incomingMessageReceived</strong></p>
              </div>
            </div>

            <div className="panel rounded-xl p-5">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Setup guide</p>
              <div className="space-y-0">
                <Step num="1" title="Create a Green API account">
                  <p>Sign up free at <a href="https://green-api.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">green-api.com <ExternalLink size={11} /></a>. The free Developer plan allows real WhatsApp delivery.</p>
                </Step>

                <Step num="2" title="Create an instance and scan QR">
                  <p>In your Green API console, create a new instance. Open it and scan the QR code with your WhatsApp — this links your WhatsApp number to the API.</p>
                </Step>

                <Step num="3" title="Add credentials to Replit Secrets">
                  <p>Open the <strong>Secrets</strong> tab in Replit and add:</p>
                  <div className="rounded-lg bg-slate-900 p-3 font-mono text-xs text-emerald-300 space-y-1">
                    <p>GREENAPI_INSTANCE_ID=your-instance-id</p>
                    <p>GREENAPI_API_TOKEN=your-api-token</p>
                    <p>USE_MOCK_WHATSAPP=false</p>
                  </div>
                  <p className="text-slate-500">Find these in your Green API instance dashboard under <strong>API</strong> tab.</p>
                </Step>

                <Step num="4" title="Set the webhook URL">
                  <p>In Green API → your instance → <strong>Notifications</strong> tab, paste the webhook URL (left panel). Enable <strong>incomingMessageReceived</strong> and save.</p>
                </Step>

                <Step num="5" title="Add students with their phone numbers">
                  <p>In the Roster page, enter numbers with country code — e.g. <strong>919876543210</strong> for India. When students reply on WhatsApp, they're matched automatically.</p>
                </Step>

                <Step num="6" title="Run a session">
                  <p>Go to <strong>New Session</strong>, pick a topic, click <strong>Send via WhatsApp</strong>. Students receive questions and their replies appear live on the Session Results page.</p>
                </Step>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default WhatsAppSetup;
