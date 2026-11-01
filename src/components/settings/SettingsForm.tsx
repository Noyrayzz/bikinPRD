"use client";

import { useEffect, useMemo, useState } from "react";
import { Select } from "@/components/ui/Select";
import type { ProviderId, ProviderPreset, PublicSettings } from "@/lib/settings";

type Status = { tone: "idle" | "ok" | "error" | "busy"; message: string };

const inputClass =
  "h-11 w-full rounded-[10px] border border-line bg-bg px-3 text-[14px] text-ink placeholder:text-muted/60 transition-colors duration-150 focus:border-accent/70 focus:outline-none";

const labelClass = "mb-1.5 block text-[13px] font-medium text-ink/80";

export function SettingsForm({ presets }: { presets: ProviderPreset[] }) {
  const [provider, setProvider] = useState<ProviderId>("griphub");
  const [baseUrl, setBaseUrl] = useState(presets[0]?.baseUrl ?? "");
  const [model, setModel] = useState(presets[0]?.defaultModel ?? "");
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState<PublicSettings | null>(null);
  const [status, setStatus] = useState<Status>({ tone: "idle", message: "" });
  const [loading, setLoading] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelNote, setModelNote] = useState("");
  const [manualModel, setManualModel] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/settings")
      .then((r) => r.json() as Promise<PublicSettings>)
      .then((data) => {
        if (!alive) return;
        setSaved(data);
        if (data.configured) {
          setProvider(data.provider ?? "griphub");
          setBaseUrl(data.baseUrl ?? "");
          setModel(data.model ?? "");
          void loadModels({ provider: data.provider ?? "griphub", baseUrl: data.baseUrl ?? "" });
        }
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // loadModels hanya dipakai sekali di mount; identitasnya tidak perlu jadi dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activePreset = useMemo(
    () => presets.find((p) => p.id === provider) ?? presets[0],
    [presets, provider],
  );

  async function loadModels(overrides?: { provider?: ProviderId; baseUrl?: string }) {
    setLoadingModels(true);
    setModelNote("");
    try {
      const res = await fetch("/api/settings/models", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: overrides?.provider ?? provider,
          baseUrl: overrides?.baseUrl ?? baseUrl,
          apiKey,
        }),
      });
      const data = (await res.json()) as { models?: string[]; error?: string };
      if (!res.ok || !data.models) {
        setModelNote(data.error ?? "Gagal mengambil daftar model.");
        return;
      }
      setModels(data.models);
      setModelNote(`${data.models.length} model tersedia — ketik untuk mencari.`);
    } catch (error) {
      setModelNote(error instanceof Error ? error.message : "Gagal mengambil daftar model.");
    } finally {
      setLoadingModels(false);
    }
  }

  function chooseProvider(next: ProviderId) {
    setProvider(next);
    const preset = presets.find((p) => p.id === next);
    if (!preset) return;
    setBaseUrl(preset.baseUrl);
    setModel(preset.defaultModel);
    setStatus({ tone: "idle", message: "" });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setStatus({ tone: "busy", message: "Menyimpan…" });
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider, baseUrl, model, apiKey }),
    });
    const data = (await res.json()) as PublicSettings & { error?: string };
    if (!res.ok) {
      setStatus({ tone: "error", message: data.error ?? "Gagal menyimpan." });
      return;
    }
    setSaved(data);
    setApiKey("");
    setStatus({ tone: "ok", message: `Tersimpan. Key ${data.keyPreview} dipakai untuk generate.` });
  }

  async function test() {
    setStatus({ tone: "busy", message: "Menguji koneksi ke provider…" });
    const res = await fetch("/api/settings/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider, baseUrl, model, apiKey }),
    });
    const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };
    if (!res.ok) {
      setStatus({ tone: "error", message: data.error ?? "Gagal menguji." });
      return;
    }
    setStatus({
      tone: data.ok ? "ok" : "error",
      message: data.message ?? (data.ok ? "Koneksi oke." : "Koneksi ditolak."),
    });
  }

  const keyPlaceholder = saved?.configured
    ? `Tersimpan: ${saved.keyPreview} — isi untuk mengganti`
    : "sk-…";

  return (
    <form onSubmit={save} className="mt-8 space-y-5">
      <div>
        <label htmlFor="provider" className={labelClass}>
          Provider
        </label>
        <Select
          id="provider"
          value={provider}
          onChange={(e) => chooseProvider(e.target.value as ProviderId)}
          disabled={loading}
        >
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </Select>
        {activePreset?.hint ? (
          <p className="mt-1.5 text-[12.5px] text-muted">{activePreset.hint}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="baseUrl" className={labelClass}>
          Base URL
        </label>
        <input
          id="baseUrl"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          spellCheck={false}
          placeholder="https://…/v1"
          className={`${inputClass} font-mono text-[13px]`}
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="model" className={labelClass}>
          Model
        </label>
        <div className="flex gap-2">
          {models.length > 0 && !manualModel ? (
            <Select
              id="model"
              wrapperClassName="min-w-0 flex-1"
              value={model}
              onChange={(e) => {
                if (e.target.value === "__manual__") {
                  setManualModel(true);
                  return;
                }
                setModel(e.target.value);
              }}
              className="font-mono text-[13px]"
              disabled={loading}
            >
              {model && !models.includes(model) ? (
                <option value={model}>{model} (tersimpan)</option>
              ) : (
                <option value="">Pilih model…</option>
              )}
              {models.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
              <option value="__manual__">Tulis manual…</option>
            </Select>
          ) : (
            <input
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              spellCheck={false}
              placeholder="gpt-4o-mini"
              autoComplete="off"
              className={`${inputClass} font-mono text-[13px]`}
              disabled={loading}
            />
          )}
          <button
            type="button"
            onClick={() => loadModels()}
            disabled={loadingModels || loading}
            className="inline-flex h-10 shrink-0 items-center rounded-[10px] border border-line px-3 text-[13px] font-medium whitespace-nowrap transition-colors duration-150 hover:border-white/25 hover:bg-surface disabled:opacity-60"
          >
            {loadingModels ? "Memuat…" : models.length ? "Muat ulang" : "Muat daftar model"}
          </button>
        </div>
        {models.length > 0 && !manualModel ? null : (
          <p className="mt-1.5 text-[12.5px] text-muted">
            {modelNote ||
              "Klik Muat daftar model biar bisa milih dari provider, atau ketik manual kalau modelnya gak ada di daftar."}
          </p>
        )}
        {models.length > 0 && manualModel ? (
          <p className="mt-1.5 text-[12.5px] text-muted">
            {modelNote || "Mode tulis manual."}{" "}
            <button
              type="button"
              onClick={() => setManualModel(false)}
              className="underline decoration-line underline-offset-4 hover:decoration-accent"
            >
              Balik ke daftar
            </button>
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="apiKey" className={labelClass}>
          API key <span className="font-normal text-accent">wajib</span>
        </label>
        <div className="relative">
          <input
            id="apiKey"
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder={keyPlaceholder}
            className={`${inputClass} pr-16 font-mono text-[13px]`}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md px-2 py-1 text-[12px] text-muted transition-colors duration-150 hover:bg-surface hover:text-ink"
          >
            {showKey ? "Sembunyikan" : "Lihat"}
          </button>
        </div>
        <p className="mt-1.5 text-[12.5px] text-muted">
          Disimpan di <code className="font-mono text-ink/80">.local/settings.json</code> di
          mesin ini, tidak pernah dikirim balik ke browser dalam bentuk utuh.
        </p>
      </div>

      <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 items-center justify-center rounded-[10px] bg-accent px-5 text-[14px] font-semibold text-white transition-colors duration-150 hover:bg-accent-hover disabled:opacity-60"
        >
          Simpan
        </button>
        <button
          type="button"
          onClick={test}
          disabled={loading}
          className="inline-flex h-11 items-center justify-center rounded-[10px] border border-line px-5 text-[14px] font-medium transition-colors duration-150 hover:border-white/25 hover:bg-surface disabled:opacity-60"
        >
          Tes koneksi
        </button>
      </div>

      <p className="text-[12.5px] text-muted">
        Tes koneksi memakai nilai di form ini tanpa menyimpan apa pun.
      </p>

      {status.message ? (
        <p
          role="status"
          className={`text-[13px] ${
            status.tone === "error"
              ? "text-accent"
              : status.tone === "ok"
                ? "text-ink"
                : "text-muted"
          }`}
        >
          {status.message}
        </p>
      ) : null}
    </form>
  );
}
