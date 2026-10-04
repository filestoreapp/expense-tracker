import { Wallet } from "lucide-react";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100">
        <Wallet size={26} className="text-indigo-600" />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-slate-900">Expense Tracker</h1>
      <p className="mt-2 text-sm text-slate-500">
        This is a private page. Open it with your personal link — the one that
        ends with a long code — to see the shared balance.
      </p>
    </div>
  );
}
