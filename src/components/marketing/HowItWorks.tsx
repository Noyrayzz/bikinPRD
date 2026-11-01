const steps = [
  {
    title: "Tulis ide",
    body: "Satu paragraf bebas, plus pilihan tech stack: biarkan AI yang pilih atau tentukan sendiri.",
  },
  {
    title: "Jawab pertanyaan",
    body: "3–6 pertanyaan klarifikasi soal pengguna, alur inti, dan monetisasi. Boleh dilewati — asumsinya dicatat.",
  },
  {
    title: "Generate & unduh",
    body: "PRD 17 bagian dengan ID requirement dan acceptance criteria, siap ditempel ke Claude Code atau Cursor.",
  },
];

export function HowItWorks() {
  return (
    <section className="shell pb-16 md:pb-24" aria-labelledby="how-heading">
      <h2 id="how-heading" className="sr-only">
        Cara kerja
      </h2>
      <ol className="grid gap-4 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-[16px] border border-line bg-surface p-6">
            <span className="font-mono text-[12px] text-accent">0{index + 1}</span>
            <h3 className="mt-3 text-[20px]">{step.title}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
