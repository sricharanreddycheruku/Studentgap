import { CheckCircle2, ClipboardCopy, ExternalLink, MessageCircleMore, RefreshCw, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';

const Signal = ({ label, ready, detail }) => (
  <div className={`flex items-center justify-between rounded-xl border p-4 ${
    ready ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
  }`}>
    <div>
      <p className={`font-black ${ready ? 'text-emerald-800' : 'text-amber-900'}`}>{label}</p>
      {detail && <p className={`mt-0.5 text-xs ${ready ? 'text-emerald-600' : 'text-amber-700'}`}>{detail}</p>}
    </div>
    {ready
      ? <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
      : <TriangleAlert size={20} className="text-amber-600 shrink-0" />
    }
  </div>
);

const Step = ({ num, title, children }) => (
  <div className="flex gap-4">
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#11233f] text-sm font-black text-white">{num}</span>
    <div className="min-w-0 pb-6 border-b border-slate-100 last:border-0">
      <h3 className="font-black text-[#11233f]">{title}</h3>
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
            Connect Twilio to send real MCQs to students and receive their answers.
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
            <Signal label="API" detail="Backend online" ready={status.api === 'online'} />
            <Signal label="Database" detail="PostgreSQL connected" ready={status.database} />
            <Signal
              label="AI (Gemini)"
              detail={status.geminiConfigured ? 'Key configured' : 'GEMINI_API_KEY missing'}
              ready={status.geminiConfigured}
            />
            <Signal
              label={status.whatsappMode === 'twilio' ? 'Twilio live' : 'Mock mode'}
              detail={status.whatsappMode === 'twilio' ? 'Real WhatsApp active' : 'USE_MOCK_WHATSAPP=true'}
              ready={status.whatsappMode === 'mock' || status.twilioConfigured}
            />
          </section>

          {status.whatsappMode === 'mock' && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="font-black text-blue-800">Currently in Mock mode</p>
              <p className="mt-1 text-sm text-blue-700">
                Questions and feedback are logged but not sent to real phones. Complete the steps below to enable real WhatsApp delivery.
              </p>
            </div>
          )}

          {status.whatsappMode === 'twilio' && status.twilioConfigured && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              <div>
                <p className="font-black text-emerald-800">Real WhatsApp is active!</p>
                <p className="mt-0.5 text-sm text-emerald-700">
                  Sender: <strong>{status.sender}</strong> · Messages are sent to real phones.
                </p>
              </div>
            </div>
          )}

          <section className="grid gap-5 xl:grid-cols-[1fr_1.4fr]">
            <div className="panel rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                  <MessageCircleMore size={19} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Webhook URL</p>
                  <h2 className="font-black text-[#11233f]">Paste in Twilio</h2>
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
                  {copied ? <CheckCircle2 size={16} /> : <ClipboardCopy size={16} />}
                </button>
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-500">
                <p>· In Twilio sandbox: <strong>When a message comes in</strong></p>
                <p>· Method: <strong>POST</strong></p>
                <p>· This URL handles incoming student WhatsApp replies</p>
              </div>

              {status.missingTwilio?.length > 0 && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-black text-amber-800 mb-1">Missing secrets:</p>
                  {status.missingTwilio.map((key) => (
                    <p key={key} className="text-xs font-mono text-amber-700">· {key}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="panel rounded-xl p-5">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Setup guide</p>
              <div className="space-y-0">
                <Step num="1" title="Create a Twilio account">
                  <p>Sign up at <a href="https://twilio.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">twilio.com <ExternalLink size={12} /></a>. Free trial gives $15 credit — enough to test with dozens of students.</p>
                </Step>

                <Step num="2" title="Activate WhatsApp Sandbox">
                  <p>In your Twilio console, go to <strong>Messaging → Try it out → Send a WhatsApp message</strong>. Follow instructions to join the sandbox with your phone.</p>
                </Step>

                <Step num="3" title="Add secrets to Replit">
                  <p>Open the <strong>Secrets</strong> tab in Replit and add these three values:</p>
                  <div className="rounded-lg bg-slate-900 p-3 font-mono text-xs text-emerald-300 space-y-1">
                    <p>TWILIO_ACCOUNT_SID=ACxxxxxxx</p>
                    <p>TWILIO_AUTH_TOKEN=xxxxxxxx</p>
                    <p>TWILIO_WHATSAPP_NUMBER=+14155238886</p>
                  </div>
                  <p className="text-slate-500">Find your Account SID and Auth Token on the Twilio Console homepage. The WhatsApp number is shown in your sandbox settings.</p>
                </Step>

                <Step num="4" title="Set USE_MOCK_WHATSAPP to false">
                  <p>In Replit Secrets, add or update:</p>
                  <div className="rounded-lg bg-slate-900 p-3 font-mono text-xs text-emerald-300">
                    <p>USE_MOCK_WHATSAPP=false</p>
                  </div>
                  <p>Then restart the workflow for changes to take effect.</p>
                </Step>

                <Step num="5" title="Configure the webhook in Twilio">
                  <p>In your Twilio sandbox settings, paste the webhook URL (left panel) into the <strong>"When a message comes in"</strong> field. Set method to <strong>POST</strong>.</p>
                </Step>

                <Step num="6" title="Add student phone numbers with country code">
                  <p>In the Roster page, enter student numbers including country code: <strong>+919876543210</strong> for India (91 + 10 digits). Students who WhatsApp back from that number are matched automatically.</p>
                </Step>

                <Step num="7" title="Enable Gemini AI (optional but recommended)">
                  <p>Add your Gemini API key to Replit Secrets:</p>
                  <div className="rounded-lg bg-slate-900 p-3 font-mono text-xs text-emerald-300">
                    <p>GEMINI_API_KEY=AIzaSyxxxxxx</p>
                  </div>
                  <p>Get a free key at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">aistudio.google.com <ExternalLink size={12} /></a>. Without it, fallback questions are used.</p>
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
