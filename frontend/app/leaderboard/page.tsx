'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function LeaderboardPage() {
  const [colleges, setColleges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      // Sort by totalPoints descending
      const data = await api.colleges.list('sortBy=score.totalPoints&sortOrder=desc');
      setColleges(data.items || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
        <button
          onClick={fetchLeaderboard}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">Calculating standings...</div>
      ) : (
        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-blue-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Rank</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">College</th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Prizes (1st/2nd/3rd)</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Total Points</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {colleges.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">No scores recorded yet.</td>
                </tr>
              ) : (
                colleges.sort((a, b) => (b.score?.totalPoints || 0) - (a.score?.totalPoints || 0)).map((college, index) => (
                  <tr key={college.id} className={index < 3 ? 'bg-yellow-50/30' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-800' :
                        index === 2 ? 'bg-orange-300 text-orange-900' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{college.name}</div>
                      <div className="text-xs text-gray-500">{college.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2 text-sm">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded border border-yellow-200">{college.score?.firstPlaceCount || 0}</span>
                        <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-200">{college.score?.secondPlaceCount || 0}</span>
                        <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded border border-orange-200">{college.score?.thirdPlaceCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-lg font-black text-blue-700">{college.score?.totalPoints || 0}</span>
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
