'use client';

import { useState, useEffect, use } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function EventRegistrationsPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const eventId = params.id;
  
  const [event, setEvent] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [dummyId, setDummyId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eData, rData, pData] = await Promise.all([
        api.events.get(eventId),
        api.events.participations.list(eventId),
        api.participants.list()
      ]);
      setEvent(eData);
      setRegistrations(rData.items || []);
      setParticipants(pData.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipantId) return;
    
    try {
      setSubmitting(true);
      await api.events.participations.register({
        eventId: parseInt(eventId),
        participantId: parseInt(selectedParticipantId),
        teamId: teamId || undefined,
        dummyId: dummyId || undefined
      });
      setSelectedParticipantId('');
      setTeamId('');
      setDummyId('');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this registration?')) return;
    try {
      await api.events.participations.delete(id);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="py-10 text-center text-gray-500">Loading registrations...</div>;
  if (error) return <div className="py-10 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{event?.name}</h1>
          <p className="text-gray-500">Manage Event Registrations</p>
        </div>
        <Link href="/events" className="text-blue-600 hover:underline">Back to Events</Link>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Register Participant</h2>
        <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Participant</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={selectedParticipantId}
              onChange={(e) => setSelectedParticipantId(e.target.value)}
              required
            >
              <option value="">Choose a participant...</option>
              {participants.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.participantId}) - {p.college?.code}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team ID (Optional)</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder="e.g. TEAM-01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dummy ID (Optional)</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2"
              value={dummyId}
              onChange={(e) => setDummyId(e.target.value)}
              placeholder="Unique per event"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add'}
          </button>
        </form>
      </div>

      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Participant</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">College</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Team ID</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {registrations.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">No participants registered yet.</td>
              </tr>
            ) : (
              registrations.map((reg) => (
                <tr key={reg.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{reg.participant?.name}</div>
                    <div className="text-xs text-gray-500">{reg.participant?.participantId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reg.participant?.college?.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-mono text-gray-600">
                    {reg.teamId || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(reg.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
