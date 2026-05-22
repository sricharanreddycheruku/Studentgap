import { Sparkles } from 'lucide-react';

const ReteachSuggestion = ({ insight }) => (
  <section className="rounded-lg border border-blue-200 bg-[#11233f] p-5 text-white shadow-2xl shadow-slate-300">
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-300 text-[#11233f]">
        <Sparkles size={20} aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-bold uppercase text-cyan-200">Five-minute intervention</p>
        <h2 className="mt-1 text-xl font-black">Reteach suggestion</h2>
      </div>
    </div>
    <p className="mt-5 text-base leading-7 text-slate-100">
      {insight?.reteachActivity || 'Analyse responses to generate a practical reteach activity for this class.'}
    </p>
  </section>
);

export default ReteachSuggestion;
