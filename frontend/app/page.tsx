import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-8 shadow">
        <h1 className="text-3xl font-bold">VersionOps — Fest Management Dashboard</h1>
        <p className="mt-2 text-blue-100">Prototype UI for the NestJS backend (prefix: /api/v1)</p>
        <p className="mt-1 text-blue-100 text-sm">Set NEXT_PUBLIC_API_URL to your backend base, e.g. http://localhost:3000/api/v1</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/colleges" className="block bg-white border rounded-lg p-6 hover:shadow-md transition">
          <h2 className="text-xl font-semibold">Colleges</h2>
          <p className="mt-2 text-gray-600 text-sm">Create and manage colleges. View participant counts and scores.</p>
        </Link>
        <Link href="/participants" className="block bg-white border rounded-lg p-6 hover:shadow-md transition">
          <h2 className="text-xl font-semibold">Participants</h2>
          <p className="mt-2 text-gray-600 text-sm">Register participants, and perform check-in on arrival.</p>
        </Link>
        <Link href="/events" className="block bg-white border rounded-lg p-6 hover:shadow-md transition">
          <h2 className="text-xl font-semibold">Events</h2>
          <p className="mt-2 text-gray-600 text-sm">Manage events and their points.</p>
        </Link>
        <Link href="/leaderboard" className="block bg-white border rounded-lg p-6 hover:shadow-md transition">
          <h2 className="text-xl font-semibold">Leaderboard</h2>
          <p className="mt-2 text-gray-600 text-sm">See college standings and total points.</p>
        </Link>
      </section>

      <section className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold">How this prototype calls the backend</h3>
        <ul className="mt-3 list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>Global API base URL comes from <code>NEXT_PUBLIC_API_URL</code>. Default: <code>http://localhost:3000/api/v1</code>.</li>
          <li>Endpoints used: <code>GET/POST /colleges</code>, <code>GET/POST /participants</code>, <code>POST /participants/:id/check-in</code>.</li>
          <li>Lists expect a response with <code>items</code> and use optional fields like <code>score</code> and <code>participantCount</code>.</li>
        </ul>
      </section>
    </div>
  );
}
