/**
 * SearchBar Component
 * Reusable search input
 */
const SearchBar = ({ value, onChange, placeholder = 'Search...' }) => {
  return (
    <div className="relative mb-6">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">
        ⌕
      </span>
      <input
        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default SearchBar;
