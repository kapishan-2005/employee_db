/**
 * PageHeader Component
 * Reusable page header with title and action button
 */
const PageHeader = ({ title, subtitle, action }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
      <div>
        {subtitle && (
          <p className="text-xs text-indigo-400 tracking-[0.25em] uppercase mb-1">
            {subtitle}
          </p>
        )}
        <h1 className="text-4xl font-bold tracking-tight">
          {title.split(' ').map((word, i) =>
            i === title.split(' ').length - 1 ? (
              <span
                key={i}
                className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400"
              >
                {word}
              </span>
            ) : (
              <span key={i}>{word} </span>
            )
          )}
        </h1>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export default PageHeader;
