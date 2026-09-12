import Link from "next/link";

export default function Page() {
  return (
    <>
      

<main className="flex-grow flex items-center justify-center relative overflow-hidden px-6 py-12">

<div className="absolute top-1/4 left-1/4 w-96 h-96 ai-glow-orb pointer-events-none"></div>
<div className="absolute bottom-1/4 right-1/4 w-80 h-80 ai-glow-orb pointer-events-none" style={{"background":"radial-gradient(circle, rgba(255, 151, 181, 0.1) 0%, transparent 70%)"}}></div>

<div className="max-w-2xl w-full relative">
<div className="glass-panel rounded-xl shadow-[0px_20px_40px_rgba(186,158,255,0.04)] p-8 md:p-12 text-center border border-outline-variant/15">

<div className="mb-10 relative inline-block">
<div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-primary to-tertiary flex items-center justify-center relative z-10 shadow-[0px_0px_30px_rgba(186,158,255,0.3)]">
<span className="material-symbols-outlined text-on-primary-fixed text-5xl" data-icon="bolt" data-weight="fill" style={{"fontVariationSettings":"'FILL' 1"}}>bolt</span>
</div>

<div className="absolute inset-0 scale-150 border-2 border-dashed border-primary/20 rounded-full animate-[spin_20s_linear_infinite]"></div>
<div className="absolute inset-0 scale-125 border border-tertiary/10 rounded-full"></div>
</div>

<h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-on-surface to-on-surface-variant">
                    Let&apos;s launch your AI Agent to the world.
                </h1>
<p className="text-on-surface-variant text-lg md:text-xl max-w-lg mx-auto mb-12 leading-relaxed">
                    It takes about 5 minutes to create a rich, high-converting listing for your AI tool.
                </p>

<div className="flex flex-col items-center gap-6">
<Link href="/seller/new/step1"><Link href="/explore"><button className="w-full max-w-sm py-5 px-10 bg-gradient-to-r from-primary-dim to-primary rounded-lg text-on-primary font-headline font-bold text-lg shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
                        Start Listing My Agent
                    </button></Link>
<button className="text-on-surface-variant hover:text-primary-fixed-dim transition-colors duration-200 text-sm font-medium border-b border-transparent hover:border-primary-fixed-dim pb-0.5">
                        I&apos;ll do this later
                    </button></Link>
</div>

<div className="mt-16 flex flex-wrap justify-center gap-3">
<div className="bg-surface-container-high px-4 py-2 rounded-full flex items-center gap-2 border border-outline-variant/10">
<span className="material-symbols-outlined text-secondary text-sm" data-icon="verified_user">verified_user</span>
<span className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Secure Integration</span>
</div>
<div className="bg-surface-container-high px-4 py-2 rounded-full flex items-center gap-2 border border-outline-variant/10">
<span className="material-symbols-outlined text-tertiary text-sm" data-icon="trending_up">trending_up</span>
<span className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Instant Visibility</span>
</div>
<div className="bg-surface-container-high px-4 py-2 rounded-full flex items-center gap-2 border border-outline-variant/10">
<span className="material-symbols-outlined text-primary text-sm" data-icon="auto_awesome">auto_awesome</span>
<span className="text-xs font-label uppercase tracking-widest text-on-surface-variant">AI Optimization</span>
</div>
</div>
</div>

<div className="mt-8 flex justify-center gap-2">
<div className="w-8 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(186,158,255,0.4)]"></div>
<div className="w-2 h-1.5 rounded-full bg-surface-container-highest"></div>
<div className="w-2 h-1.5 rounded-full bg-surface-container-highest"></div>
<div className="w-2 h-1.5 rounded-full bg-surface-container-highest"></div>
</div>
</div>
</main>

<footer className="w-full py-12 px-8 mt-auto border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
<div className="text-sm font-bold text-slate-500 uppercase font-headline">aiKart.co</div>
<div className="flex gap-8">
<a className="text-slate-600 hover:text-primary transition-colors text-xs uppercase tracking-widest font-label" href="/explore">Privacy Policy</a>
<a className="text-slate-600 hover:text-primary transition-colors text-xs uppercase tracking-widest font-label" href="/explore">Terms of Service</a>
<a className="text-slate-600 hover:text-primary transition-colors text-xs uppercase tracking-widest font-label" href="/explore">AI Ethics Charter</a>
</div>
<div className="text-slate-600 text-xs uppercase tracking-widest font-label">© 2026 aiKart.co</div>
</footer>

    </>
  );
}
