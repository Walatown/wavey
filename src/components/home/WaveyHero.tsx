const navItems = ['spots', 'forecast', 'about', 'contact'];

export function WaveyHero() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        src="/15845136_3840_2160_25fps.mp4"
      />

      <div className="absolute left-0 right-0 top-0 z-20 px-6 pt-6 md:px-10">
        <nav className="flex items-center justify-between gap-4">
          <a
            href="#"
            aria-label="wavey home"
            className="flex items-center gap-2 rounded-full bg-neutral-900/90 py-3 pl-4 pr-6 backdrop-blur"
          >
            <svg
              viewBox="0 0 240 240"
              className="h-8 w-8"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              focusable="false"
            >
              <g fill="#ffffff" transform="translate(120, 140) rotate(-18)">
                <circle cx="0" cy="-52" r="9" />
                <path d="M -4 -43 Q -12 -24 -14 -2 Q -14 8 -6 12 L 8 12 Q 14 8 14 -2 Q 12 -24 6 -43 Z" />
                <path d="M -10 -30 Q -28 -18 -42 0 Q -46 4 -42 7 Q -38 8 -34 4 Q -22 -10 -6 -22 Z" />
                <path d="M 12 -34 Q 26 -42 36 -50 Q 39 -52 37 -55 Q 34 -56 30 -54 Q 18 -46 8 -38 Z" />
                <path d="M -4 10 Q -16 22 -20 36 Q -21 40 -16 40 L -8 40 Q -6 28 -2 16 Z" />
                <path d="M 8 10 Q 16 22 19 34 Q 20 38 16 38 L 9 38 Q 8 26 6 16 Z" />
                <ellipse cx="0" cy="46" rx="46" ry="5" />
              </g>
              <path
                d="M 30 200 Q 120 170 220 200"
                stroke="#ffffff"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                opacity="0.5"
              />
            </svg>
            <span className="text-sm font-normal tracking-tight text-white">wavey</span>
          </a>

          <div className="hidden items-center gap-1 rounded-full bg-neutral-900/90 px-3 py-2 backdrop-blur md:flex">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item}`}
                className="rounded-full px-5 py-2 text-sm text-neutral-300 transition-colors hover:text-white"
              >
                {item}
              </a>
            ))}
          </div>

          <a
            href="#spots"
            className="rounded-full bg-white px-6 py-3 text-sm font-normal text-black transition-colors hover:bg-neutral-200"
          >
            get started
          </a>
        </nav>
      </div>

      <div className="relative h-full w-full">
        <h1 className="hero-title absolute left-4 top-[18%] text-[14vw] font-medium text-white md:left-10 md:text-[13vw]">
          catch
        </h1>
        <h1 className="hero-title absolute right-4 top-[38%] text-[14vw] font-medium text-white md:right-10 md:text-[13vw]">
          your
        </h1>
        <h1 className="hero-title absolute left-[18%] top-[58%] text-[14vw] font-medium text-white md:left-[28%] md:text-[13vw]">
          wave
        </h1>

        <p className="absolute left-6 top-[46%] max-w-[240px] text-[15px] leading-snug text-white/90 md:left-10">
          live surf scores for bali, built for beginners learning to read the ocean
        </p>

        <div className="absolute right-6 top-[14%] md:right-24">
          <div className="flex items-center justify-end gap-3">
            <span className="hidden h-px w-24 rotate-[20deg] bg-white/40 md:block" />
            <span className="text-4xl font-medium tracking-tight md:text-5xl">+12</span>
          </div>
          <p className="mt-1 text-right text-xs text-white/70 md:text-sm">spots tracked daily</p>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-b from-transparent to-[#07090f]" />

        <div className="absolute bottom-20 left-6 md:bottom-24 md:left-20">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-medium tracking-tight md:text-5xl">+24h</span>
            <span className="hidden h-px w-24 rotate-[-20deg] bg-white/40 md:block" />
          </div>
          <p className="mt-1 text-xs text-white/70 md:text-sm">forecast horizon</p>
        </div>

        <div className="absolute bottom-16 right-6 md:bottom-20 md:right-20">
          <div className="flex items-center justify-end gap-3">
            <span className="hidden h-px w-24 rotate-[-20deg] bg-white/40 md:block" />
            <span className="text-4xl font-medium tracking-tight md:text-5xl">+1k</span>
          </div>
          <p className="mt-1 text-right text-xs text-white/70 md:text-sm">sessions scored</p>
        </div>
      </div>
    </section>
  );
}
