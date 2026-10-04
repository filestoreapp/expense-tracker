import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getExpenseToken } from "@/lib/expenses";

export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  return req.headers.get("x-expense-token") === getExpenseToken();
}

/** DELETE /api/expenses/[id] — remove one entry. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const entryId = Number(id);
  if (!Number.isInteger(entryId) || entryId <= 0) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("expense_ledger")
    .delete()
    .eq("id", entryId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
