import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import {
  getExpenseToken,
  EXPENSE_KINDS,
  summarize,
  type ExpenseKind,
} from "@/lib/expenses";

export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  return req.headers.get("x-expense-token") === getExpenseToken();
}

/** GET /api/expenses — entries (newest first) + summary. */
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("expense_ledger")
    .select("id, created_at, entry_date, kind, amount, her_share, note")
    .order("entry_date", { ascending: false })
    .order("id", { ascending: false })
    .limit(500);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const entries = data ?? [];
  return NextResponse.json({ entries, summary: summarize(entries) });
}

/** POST /api/expenses — add one entry. */
export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const kind = body?.kind as ExpenseKind | undefined;
  const amount = Number(body?.amount);
  const herShareRaw = body?.her_share;
  const herShare =
    herShareRaw === null || herShareRaw === undefined || herShareRaw === ""
      ? null
      : Number(herShareRaw);
  const note = String(body?.note ?? "").slice(0, 200);
  const entryDate =
    typeof body?.entry_date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(body.entry_date)
      ? body.entry_date
      : new Date().toISOString().slice(0, 10);

  if (!kind || !EXPENSE_KINDS.includes(kind)) {
    return NextResponse.json({ error: "Invalid entry type." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Amount must be greater than zero." },
      { status: 400 }
    );
  }
  if (
    kind === "shared" &&
    (herShare === null || !Number.isFinite(herShare) || herShare < 0)
  ) {
    return NextResponse.json(
      { error: "Enter her share of the expense." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("expense_ledger")
    .insert({
      kind,
      amount,
      her_share: kind === "shared" ? herShare : null,
      note,
      entry_date: entryDate,
    })
    .select("id, created_at, entry_date, kind, amount, her_share, note")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ entry: data });
}
