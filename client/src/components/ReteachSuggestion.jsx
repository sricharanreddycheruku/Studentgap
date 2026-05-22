import { Sparkles } from 'lucide-react';

const ReteachSuggestion = ({ insight }) => (
  <section className="relative overflow-hidden rounded-xl bg-[#11233f] p-5 text-white shadow-xl">
    <div className="absolute inset-0 opacity-5 pointer-events-none"
      style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #60a5fa 0%, transparent 60%)' }}
    />
    <div className="relative">
      <div className="flex items-start gap-3 mb-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
          <Sparkles size={18} />
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">5-min intervention</p>
          <h2 className="mt-0.5 text-lg font-black text-white">Reteach suggestion</h2>
        </div>
      </div>
      <p className="text-sm leading-7 text-slate-300">
        {insight?.reteachActivity || 'Analyse responses to generate a practical reteach activity tailored to this class\'s gaps.'}
      </p>
    </div>
  </section>
);

export default ReteachSuggestion;
