import DashboardClient from "./DashboardClient";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <DashboardClient />
      </div>
    </div>
  );
}
