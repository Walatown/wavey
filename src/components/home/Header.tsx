interface HeaderProps {
  onShowConditions: () => void;
}

export function Header({ onShowConditions }: HeaderProps) {
  return (
    <>
      <nav className="flex items-center justify-between border-b border-[#e0f4ff] bg-white px-10 py-4">
        <div
          className="text-2xl font-bold text-[#0077b6]"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          Wavey
        </div>
        <ul className="flex list-none gap-7">
          <li>
            <button
              type="button"
              onClick={onShowConditions}
              className="text-sm font-semibold text-[#2d4a5a] transition-colors hover:text-[#0077b6]"
            >
              Conditions
            </button>
          </li>
          <li>
            <span className="text-sm font-semibold text-[#2d4a5a]">Forecast</span>
          </li>
          <li>
            <span className="text-sm font-semibold text-[#2d4a5a]">About</span>
          </li>
        </ul>
      </nav>

      <section className="bg-gradient-to-b from-[#f0faff] to-[#e0f4ff] px-10 py-16 text-center">
        <h1 className="mb-4 text-5xl font-bold leading-tight text-[#1a2e3b]">
          Where should you surf today?
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-lg font-semibold text-[#7a9aaa]">
          Real-time surf conditions in Bali with AI-powered explanations. No jargon, just clear guidance.
        </p>
      </section>
    </>
  );
}
