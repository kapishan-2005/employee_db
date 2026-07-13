import { Link } from 'react-router-dom';

const features = [
  {
    icon: '🧠',
    title: 'AI CEO Assistant',
    desc: 'Company-wide health scores, department comparisons, and executive-level recommendations.',
  },
  {
    icon: '👥',
    title: 'AI HR Assistant',
    desc: 'Spot employees who need attention, generate reports, and speed up recruitment.',
  },
  {
    icon: '📈',
    title: 'Employee Analytics',
    desc: 'Automatic performance scoring from attendance, activity, and task data.',
  },
  {
    icon: '⏱️',
    title: 'Smart Attendance Intelligence',
    desc: 'Detect late-arrival and absence patterns before they become a problem.',
  },
  {
    icon: '🔮',
    title: 'Workforce Performance Prediction',
    desc: 'Turn historical trends into forward-looking, actionable insight.',
  },
  {
    icon: '💬',
    title: 'Role-Aware AI Chat',
    desc: 'Every role — CEO, HR, Manager, Employee — gets a persona built for them.',
  },
];

const steps = [
  { label: 'Company Data', desc: 'Employees, departments, attendance, activity logs' },
  { label: 'AI Analysis', desc: 'Gemini-powered pattern detection & scoring' },
  { label: 'Business Insights', desc: 'Plain-language findings, not raw numbers' },
  { label: 'Better Decisions', desc: 'CEO, HR, and Managers act with confidence' },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#080a0f] text-white font-sans overflow-x-hidden">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />
      <div className="pointer-events-none fixed top-0 left-1/4 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 right-1/4 w-[30rem] h-[30rem] bg-violet-600/10 rounded-full blur-3xl" />

      {/* Nav */}
      <nav className="relative max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center font-bold text-sm">
            AI
          </div>
          <span className="font-bold tracking-tight">Workforce Intelligence</span>
        </div>
        <Link
          to="/login"
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative max-w-4xl mx-auto px-6 pt-16 pb-20 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-300/70 mb-4">
          AI Workforce Intelligence Platform
        </p>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
          Manage your workforce{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
            smarter with AI-powered insights
          </span>
        </h1>
        <p className="text-white/50 text-lg max-w-2xl mx-auto mb-10">
          Your people keep doing the work. AI becomes the assistant for your
          CEO, HR, and Managers — surfacing insights, automating busywork, and
          supporting better decisions.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/login"
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="relative max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Features</p>
          <h2 className="text-3xl font-bold tracking-tight">Built for every level of your company</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative max-w-4xl mx-auto px-6 py-16 text-center">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-2">How it works</p>
        <h2 className="text-3xl font-bold tracking-tight mb-12">From raw data to real decisions</h2>

        <div className="flex flex-col md:flex-row items-stretch justify-center gap-3">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="flex-1 min-w-[160px] p-5 rounded-xl border border-white/8 bg-white/[0.02]">
                <p className="text-sm font-semibold text-white mb-1">{s.label}</p>
                <p className="text-xs text-white/40">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <span className="hidden md:block text-white/20 text-xl">→</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
          Ready to bring AI into your workforce decisions?
        </h2>
        <Link
          to="/login"
          className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-colors"
        >
          Sign In to Continue
        </Link>
      </section>

      <footer className="relative border-t border-white/10 py-6">
        <p className="text-center text-xs text-white/30">
          &copy; {new Date().getFullYear()} AI Workforce Intelligence Platform
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
