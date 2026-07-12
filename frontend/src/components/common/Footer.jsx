const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/10 bg-[#0f1117]/80 backdrop-blur-sm mt-12">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">EM</span>
            </div>
            <p className="text-sm text-white/50">
              &copy; {year} Employee Manager. All rights reserved.
            </p>
          </div>

          <div className="flex items-center gap-6 text-sm text-white/40">
            <span>Version 1.0.0</span>
            <span className="hidden md:inline">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              System Online
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
