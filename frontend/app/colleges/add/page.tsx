'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function AddCollegePage() {
  const [newCollege, setNewCollege] = useState({ code: '', name: '' });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.colleges.create(newCollege);
      router.push('/colleges');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Register New College</h1>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">College Code</label>
            <input
              type="text"
              required
              maxLength={10}
              placeholder="e.g. IITB"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={newCollege.code}
              onChange={(e) => setNewCollege({ ...newCollege, code: e.target.value.toUpperCase() })}
            />
            <p className="mt-1 text-xs text-gray-500">Maximum 10 characters, uppercase recommended.</p>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">College Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Indian Institute of Technology Bombay"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={newCollege.name}
              onChange={(e) => setNewCollege({ ...newCollege, name: e.target.value })}
            />
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
              {submitting ? 'Creating...' : 'Register College'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}