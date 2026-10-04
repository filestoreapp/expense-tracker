"use client";

import { useCallback, useEffect, useState } from "react";
import { Wallet, HandCoins, Plus, Trash2, Loader2 } from "lucide-react";
import {
  EXPENSE_KINDS,
  KIND_HINTS,
  KIND_LABELS,
  formatDate,
  formatINR,
  summarize,
  type ExpenseEntry,
  type ExpenseKind,
  type ExpenseSummary,
} from "@/lib/expenses";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function Tracker({
  token,
  friendName,
}: {
  token: string;
  friendName: string;
}) {
  const [entries, setEntries] = useState<ExpenseEntry[] | null>(null);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [kind, setKind] = useState<ExpenseKind>("her_expense");
  const [amount, setAmount] = useState("");
  const [herShare, setHerShare] = useState("");
  const [note, setNote] = useState("");
  const [entryDate, setEntryDate] = useState(todayISO());

  const headers = useCallback(
    () => ({ "x-expense-token": token, "content-type": "application/json" }),
    [token]
  );

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/expenses", { headers: headers() });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Could not load entries.");
      const list = (json.entries ?? []) as ExpenseEntry[];
      setEntries(list);
      setSummary(json.summary ?? summarize(list));
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Could not load entries."
      );
    }
  }, [headers]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          kind,
          amount: amt,
          her_share: kind === "shared" ? Number(herShare) : null,
          note: note.trim(),
          entry_date: entryDate,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Could not save.");
      setAmount("");
      setHerShare("");
      setNote("");
      setEntryDate(todayISO());
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this entry?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (!res.ok) throw new Error("Could not delete.");
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Expense Tracker</h1>
      <p className="mt-1 text-sm text-slate-500">
        Shared with {friendName} — her balance and what she owes, always up to
        date.
      </p>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <Wallet size={16} /> Her balance
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-900 sm:text-3xl">
            {summary ? formatINR(summary.her_balance) : "—"}
          </div>
          <div className="mt-1 text-xs text-emerald-700">money left</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <HandCoins size={16} /> She owes
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-900 sm:text-3xl">
            {summary ? formatINR(summary.she_owes) : "—"}
          </div>
          <div className="mt-1 text-xs text-amber-700">to be repaid</div>
        </div>
      </div>

      {/* Add entry */}
      <form
        onSubmit={submit}
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Plus size={18} className="text-indigo-600" /> Add entry
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Type
            </label>
            <select
              className={inputCls}
              value={kind}
              onChange={(e) => setKind(e.target.value as ExpenseKind)}
            >
              {EXPENSE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABELS[k]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">{KIND_HINTS[kind]}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Amount (₹)
              </label>
              <input
                className={inputCls}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Date
              </label>
              <input
                className={inputCls}
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                required
              />
            </div>
          </div>
          {kind === "shared" && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Her share (₹)
              </label>
              <input
                className={inputCls}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={herShare}
                onChange={(e) => setHerShare(e.target.value)}
                placeholder="How much of it was hers"
                required
              />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Note
            </label>
            <input
              className={inputCls}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was this for?"
              maxLength={200}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Saving…" : "Save entry"}
          </button>
        </div>
      </form>

      {/* History */}
      <div className="mt-6">
        <h2 className="text-lg font-bold text-slate-900">History</h2>
        {loadError && (
          <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {loadError} The database table may not be set up yet — run the
            setup SQL once in Supabase, then reload.
          </div>
        )}
        {entries !== null && entries.length === 0 && !loadError && (
          <p className="mt-3 text-sm text-slate-500">
            No entries yet. Add her first top-up above to get started.
          </p>
        )}
        <ul className="mt-3 space-y-2">
          {(entries ?? []).map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">
                  {e.note || KIND_LABELS[e.kind]}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {KIND_LABELS[e.kind]}
                  {e.kind === "shared" && e.her_share != null
                    ? ` · her share ${formatINR(Number(e.her_share))}`
                    : ""}
                  {" · "}
                  {formatDate(e.entry_date)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-bold text-slate-900">
                  {formatINR(Number(e.amount))}
                </span>
                <button
                  onClick={() => remove(e.id)}
                  disabled={deletingId === e.id}
                  aria-label="Delete entry"
                  className="rounded-full p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  {deletingId === e.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
