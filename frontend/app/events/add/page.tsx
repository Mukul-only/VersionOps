'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function AddEventPage() {
  const [newEvent, setNewEvent] = useState({
    name: '',
    participationPoints: 0,
    firstPrizePoints: 0,
    secondPrizePoints: 0,
    thirdPrizePoints: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.events.create(newEvent);
      router.push('/events');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Event</h1>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Event Name</label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={newEvent.name}
              onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Participation Points</label>
              <input
                type="number"
                required
                min="0"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={newEvent.participationPoints}
                onChange={(e) => setNewEvent({ ...newEvent, participationPoints: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">First Place Points</label>
              <input
                type="number"
                required
                min="0"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={newEvent.firstPrizePoints}
                onChange={(e) => setNewEvent({ ...newEvent, firstPrizePoints: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Second Place Points</label>
              <input
                type="number"
                required
                min="0"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={newEvent.secondPrizePoints}
                onChange={(e) => setNewEvent({ ...newEvent, secondPrizePoints: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Third Place Points</label>
              <input
                type="number"
                required
                min="0"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={newEvent.thirdPrizePoints}
                onChange={(e) => setNewEvent({ ...newEvent, thirdPrizePoints: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-100 transition-all"
            >
              {submitting ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
