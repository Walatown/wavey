interface SearchPanelProps {
  loading: boolean;
  error: string | null;
  onFetchConditions: () => void;
}

export function SearchPanel({ loading, error, onFetchConditions }: SearchPanelProps) {
  return (
    <div className="relative z-10 -mt-10 px-10">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-lg">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="mb-2 block text-xs font-bold uppercase text-[#7a9aaa]">
              Bali Surf Spots
            </label>
            <div className="rounded-xl border-2 border-[#e8f4f8] bg-[#e0f4ff] px-3 py-3 text-base font-semibold text-[#2d4a5a]">
              Bali
            </div>
          </div>
          <button
            type="button"
            onClick={onFetchConditions}
            disabled={loading}
            className="rounded-full bg-[#0077b6] px-7 py-3 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#00b4d8] disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Check Conditions'}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm font-medium text-[#991b1b]">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
