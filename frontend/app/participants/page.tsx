'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For create form
  const [showForm, setShowForm] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    email: '',
    collegeId: '',
    year: 'ONE',
    phone: '',
    hackerearthUser: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pData, cData] = await Promise.all([
        api.participants.list(),
        api.colleges.list()
      ]);
      setParticipants(pData.items || []);
      setColleges(cData.items || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = { ...newParticipant, collegeId: parseInt(newParticipant.collegeId) };
      await api.participants.create(payload);
      setNewParticipant({
        name: '',
        email: '',
        collegeId: '',
        year: 'ONE',
        phone: '',
        hackerearthUser: ''
      });
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckIn = async (id: number) => {
    try {
      await api.participants.checkIn(id);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this participant?')) return;
    try {
      await api.participants.delete(id);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Participants</h1>
        <a
          href="/participants/add"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md"
        >
          Add Participant
        </a>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4">Register New Participant</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full border rounded-md px-3 py-2"
                value={newParticipant.name}
                onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                required
                className="mt-1 block w-full border rounded-md px-3 py-2"
                value={newParticipant.email}
                onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">College</label>
              <select
                required
                className="mt-1 block w-full border rounded-md px-3 py-2"
                value={newParticipant.collegeId}
                onChange={(e) => setNewParticipant({ ...newParticipant, collegeId: e.target.value })}
              >
                <option value="">Select College</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Year</label>
              <select
                required
                className="mt-1 block w-full border rounded-md px-3 py-2"
                value={newParticipant.year}
                onChange={(e) => setNewParticipant({ ...newParticipant, year: e.target.value })}
              >
                <option value="ONE">Year 1</option>
                <option value="TWO">Year 2</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone (optional)</label>
              <input
                type="text"
                className="mt-1 block w-full border rounded-md px-3 py-2"
                value={newParticipant.phone}
                onChange={(e) => setNewParticipant({ ...newParticipant, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">HackerEarth User (optional)</label>
              <input
                type="text"
                className="mt-1 block w-full border rounded-md px-3 py-2"
                value={newParticipant.hackerearthUser}
                onChange={(e) => setNewParticipant({ ...newParticipant, hackerearthUser: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Registering...' : 'Register Participant'}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">Loading participants...</div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden border overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">College</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {participants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">No participants found.</td>
                </tr>
              ) : (
                participants.map((p) => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{p.participantId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.college?.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 font-medium">
                      {p.year === 'ONE' ? '1st' : '2nd'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        p.festStatus === 'CHECKED_IN' ? 'bg-green-100 text-green-800' : 
                        p.festStatus === 'REGISTERED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {p.festStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {p.festStatus === 'REGISTERED' && (
                        <button
                          onClick={() => handleCheckIn(p.id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Check-in
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
