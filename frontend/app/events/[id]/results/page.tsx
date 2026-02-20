'use client';

import { useState, useEffect, use } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function EventResultsPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const eventId = params.id;
  
  const [event, setEvent] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [position, setPosition] = useState<'FIRST' | 'SECOND' | 'THIRD'>('FIRST');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eData, resData, regData] = await Promise.all([
        api.events.get(eventId),
        api.events.results.list(eventId),
        api.events.participations.list(eventId)
      ]);
      setEvent(eData);
      setResults(resData.items || []);
      setRegistrations(regData.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipantId) return;
    
    try {
      setSubmitting(true);
      await api.events.results.add({
        eventId: parseInt(eventId),
        participantId: parseInt(selectedParticipantId),
        position
      });
      setSelectedParticipantId('');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this winner?')) return;
    try {
      await api.events.results.delete(id);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="py-10 text-center text-gray-500">Loading results...</div>;
  if (error) return <div className="py-10 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{event?.name}</h1>
          <p className="text-gray-500">Manage Event Winners</p>
        </div>
        <Link href="/events" className="text-blue-600 hover:underline">Back to Events</Link>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Assign Winner</h2>
        <form onSubmit={handleAddResult} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Registered Participant</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={selectedParticipantId}
              onChange={(e) => setSelectedParticipantId(e.target.value)}
              required
            >
              <option value="">Choose a participant...</option>
              {registrations.map(reg => (
                <option key={reg.participantId} value={reg.participantId}>
                  {reg.participant?.name} ({reg.participant?.participantId})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={position}
              onChange={(e) => setPosition(e.target.value as any)}
              required
            >
              <option value="FIRST">1st Place</option>
              <option value="SECOND">2nd Place</option>
              <option value="THIRD">3rd Place</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Assigning...' : 'Assign Winner'}
          </button>
        </form>
      </div>

      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Position</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Winner</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">College</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">No winners assigned yet.</td>
              </tr>
            ) : (
              results.sort((a, b) => {
                const order = { FIRST: 1, SECOND: 2, THIRD: 3 };
                return order[a.position as keyof typeof order] - order[b.position as keyof typeof order];
              }).map((res) => (
                <tr key={res.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      res.position === 'FIRST' ? 'bg-yellow-100 text-yellow-800' :
                      res.position === 'SECOND' ? 'bg-gray-100 text-gray-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {res.position === 'FIRST' ? '1st' : res.position === 'SECOND' ? '2nd' : '3rd'} Place
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{res.participant?.name}</div>
                    <div className="text-xs text-gray-500">{res.participant?.participantId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {res.participant?.college?.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(res.id)}
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
