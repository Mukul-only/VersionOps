'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function AddParticipantPage() {
  const [colleges, setColleges] = useState<any[]>([]);
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    email: '',
    collegeId: '',
    year: 'ONE',
    phone: '',
    hackerearthUser: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api.colleges.list().then(data => setColleges(data.items || []));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = { ...newParticipant, collegeId: parseInt(newParticipant.collegeId) };
      await api.participants.create(payload);
      router.push('/participants');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv, .xlsx, .xls';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        alert(`Importing ${file.name}... (Bulk import API would be called here)`);
        // In a real scenario, we'd parse this or send to bulkImport endpoint
        api.participants.bulkImport([{ dummy: 'data' }]).then(() => {
            alert('Bulk import successful (dummy)');
            router.push('/participants');
        });
      }
    };
    input.click();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Register Participant</h1>
        <button
          onClick={handleImport}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Import Excel/CSV
        </button>
      </div>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={newParticipant.name}
              onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={newParticipant.email}
              onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">College</label>
            <select
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={newParticipant.collegeId}
              onChange={(e) => setNewParticipant({ ...newParticipant, collegeId: e.target.value })}
            >
              <option value="">Select College</option>
              {colleges.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Year of Study</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={newParticipant.year}
              onChange={(e) => setNewParticipant({ ...newParticipant, year: e.target.value })}
            >
              <option value="ONE">Year 1</option>
              <option value="TWO">Year 2</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={newParticipant.phone}
              onChange={(e) => setNewParticipant({ ...newParticipant, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">HackerEarth Username</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={newParticipant.hackerearthUser}
              onChange={(e) => setNewParticipant({ ...newParticipant, hackerearthUser: e.target.value })}
            />
          </div>

          <div className="md:col-span-2 pt-4 flex gap-4">
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
              {submitting ? 'Registering...' : 'Register Participant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}