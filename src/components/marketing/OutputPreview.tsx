const checks = [
  { label: "Semua bagian wajib + lolos JSON Schema", weight: 25 },
  { label: "Traceability US → FR → Task", weight: 20 },
  { label: "Acceptance criteria di setiap FR", weight: 15 },
  { label: "Konsistensi Data Model ↔ API", weight: 15 },
  { label: "Review LLM: kontradiksi & edge case", weight: 15 },
  { label: "Deteksi kata ambigu", weight: 10 },
];

export function OutputPreview() {
  return (
    <section
      className="border-y border-line bg-surface/40 py-16 md:py-24"
      aria-labelledby="output-heading"
    >
      <div className="shell">
        <div className="max-w-2xl">
          <h2 id="output-heading" className="text-[28px] md:text-[32px]">
            Apa yang kamu dapat
          </h2>
          <p className="mt-3 text-[15.5px] leading-relaxed text-muted">
            Bukan ringkasan ngambang. PRD-nya punya ID requirement, acceptance
            criteria yang bisa diuji, dan task yang bisa langsung dikerjakan agent
            satu per satu.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-[16px] border border-line bg-bg">
            <div className="flex items-center justify-between border-b border-line bg-surface-2/60 px-4 py-2.5">
              <span className="font-mono text-[12px] text-muted">PRD.md</span>
              <span className="font-mono text-[11px] text-muted/70">
                hasil generate, section 6
              </span>
            </div>
            <div className="overflow-x-auto px-4 py-4">
              <pre className="font-mono text-[12.5px] leading-[1.75] whitespace-pre">
                <code>
                  <span className="text-ink">## 6. Kebutuhan Fungsional</span>
                  {"\n\n"}
                  <span className="text-ink">### </span>
                  <span className="text-accent">FR-001</span>
                  <span className="text-ink"> — Simpan jadwal booking lapangan</span>
                  {"\n"}
                  <span className="text-muted">Prioritas: Must · US-001, US-003</span>
                  {"\n\n"}
                  <span className="text-ink">**Acceptance Criteria**</span>
                  {"\n"}
                  <span className="text-muted">- Given</span>
                  <span className="text-ink"> pemilik GOR sudah login</span>
                  {"\n"}
                  <span className="text-muted">  When</span>
                  <span className="text-ink"> ia menyimpan slot 1 jam</span>
                  {"\n"}
                  <span className="text-muted">  Then</span>
                  <span className="text-ink"> slot tersimpan dan muncul di kalender</span>
                  {"\n"}
                  <span className="text-muted">  dalam </span>
                  <span className="text-ink">≤ 2 detik.</span>
                  {"\n\n"}
                  <span className="text-muted">- Given</span>
                  <span className="text-ink"> slot yang sama sudah dibooking</span>
                  {"\n"}
                  <span className="text-muted">  When</span>
                  <span className="text-ink"> ia menyimpan</span>
                  {"\n"}
                  <span className="text-muted">  Then</span>
                  <span className="text-ink"> API membalas </span>
                  <span className="text-accent">409 slot_conflict</span>
                  <span className="text-ink"> dan data tidak berubah.</span>
                  {"\n\n"}
                  <span className="text-ink">### </span>
                  <span className="text-accent">T-004</span>
                  <span className="text-ink"> — Endpoint simpan booking</span>
                  {"\n"}
                  <span className="text-muted">FR-001 · depends on T-003 · M</span>
                </code>
              </pre>
            </div>
          </div>

          <div className="flex flex-col rounded-[16px] border border-line bg-surface p-6">
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-[34px] leading-none font-bold text-ink">
                88
              </span>
              <span className="text-[13px] text-muted">/ 100 skor validator</span>
            </div>
            <p className="mt-2 text-[13.5px] text-muted">
              Dihitung otomatis setelah generate. Skor di bawah 70 diperbaiki sekali
              lagi sebelum sampai ke kamu.
            </p>

            <ul className="mt-6 space-y-2.5 border-t border-line pt-5">
              {checks.map((check) => (
                <li
                  key={check.label}
                  className="flex items-start justify-between gap-4 text-[13px]"
                >
                  <span className="flex gap-2 text-ink/90">
                    <svg
                      viewBox="0 0 16 16"
                      aria-hidden
                      className="mt-[3px] size-3.5 shrink-0 text-accent"
                    >
                      <path
                        d="M3.5 8.5l3 3 6-7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {check.label}
                  </span>
                  <span className="font-mono text-[11.5px] text-muted">{check.weight}</span>
                </li>
              ))}
            </ul>

            <p className="mt-auto pt-5 text-[12.5px] leading-relaxed text-muted/90">
              Temuan dari validator muncul di editor sebagai saran, bukan dinding error —
              tiap temuan punya tombol Perbaiki.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
