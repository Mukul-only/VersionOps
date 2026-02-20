'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SidebarItem = ({ title, items, isOpen, onToggle }: { 
  title: string, 
  items: { label: string, href: string }[], 
  isOpen: boolean, 
  onToggle: () => void 
}) => {
  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-gray-300 hover:bg-gray-800 hover:text-white transition-colors rounded-lg group"
      >
        <span className="font-medium">{title}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="mt-1 ml-4 space-y-1 border-l border-gray-700">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Sidebar() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const pathname = usePathname();

  const sections = [
    {
      title: 'Colleges',
      id: 'colleges',
      items: [
        { label: 'View Colleges', href: '/colleges' },
        { label: 'Add College', href: '/colleges/add' },
      ],
    },
    {
      title: 'Participants',
      id: 'participants',
      items: [
        { label: 'View Participants', href: '/participants' },
        { label: 'Add Participant', href: '/participants/add' },
      ],
    },
    {
      title: 'Events',
      id: 'events',
      items: [
        { label: 'View Events', href: '/events' },
        { label: 'Add Event', href: '/events/add' },
      ],
    },
  ];

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <aside className="w-64 bg-gray-900 h-screen sticky top-0 flex flex-col border-r border-gray-800">
      <div className="p-6">
        <Link href="/" className="text-2xl font-bold text-blue-500 tracking-tight">
          VersionOps
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
        <Link
          href="/"
          className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          }`}
        >
          Dashboard
        </Link>
        
        {sections.map((section) => (
          <SidebarItem
            key={section.id}
            title={section.title}
            items={section.items}
            isOpen={openSection === section.id}
            onToggle={() => toggleSection(section.id)}
          />
        ))}

        <Link
          href="/leaderboard"
          className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/leaderboard' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          }`}
        >
          Leaderboard
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 text-center">
          © 2026 VersionOps
        </div>
      </div>
    </aside>
  );
}