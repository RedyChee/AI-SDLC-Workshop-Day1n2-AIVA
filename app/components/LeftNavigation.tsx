'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
}

interface List {
  id: number;
  name: string;
  icon: string;
  color: string;
  position: number;
  taskCount?: number;
}

interface SmartView {
  id: string;
  name: string;
  icon: string;
  count: number;
}

interface LeftNavigationProps {
  user: User | null;
  onLogout: () => void;
  activeView: string;
  onViewChange: (viewId: string) => void;
}

export function LeftNavigation({ user, onLogout, activeView, onViewChange }: LeftNavigationProps) {
  const router = useRouter();
  const [lists, setLists] = useState<List[]>([]);
  const [smartViews, setSmartViews] = useState<SmartView[]>([
    { id: 'today', name: 'Today', icon: '📅', count: 0 },
    { id: 'next7days', name: 'Next 7 Days', icon: '📆', count: 0 },
    { id: 'inbox', name: 'Inbox', icon: '📥', count: 0 },
  ]);
  const [filterViews] = useState([
    { id: 'thisweek', name: 'This Week', icon: '📊', count: 0 },
    { id: 'unscheduled', name: 'Unscheduled', icon: '📝', count: 0 },
    { id: 'completed', name: 'Completed', icon: '✅', count: 0 },
  ]);
  const [showNewListModal, setShowNewListModal] = useState(false);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/lists');
      if (response.ok) {
        const data = await response.json();
        setLists(data);
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    }
  };

  const createList = async (name: string, icon: string, color: string) => {
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, icon, color }),
      });
      if (response.ok) {
        await fetchLists();
        setShowNewListModal(false);
      }
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* User Profile */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <span className="font-medium text-gray-900">{user?.username}</span>
          </div>
          <button
            onClick={onLogout}
            className="text-gray-500 hover:text-gray-700"
            title="Logout"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Smart Views */}
        <div className="py-4">
          <div className="px-4">
            {smartViews.map((view) => (
              <button
                key={view.id}
                onClick={() => onViewChange(view.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg mb-1 transition-colors ${
                  activeView === view.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span>{view.icon}</span>
                  <span className="font-medium">{view.name}</span>
                </div>
                {view.count > 0 && (
                  <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                    {view.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Lists */}
        <div className="py-4 border-t border-gray-200">
          <div className="px-4 mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-500 uppercase">Lists</h3>
            <button
              onClick={() => setShowNewListModal(true)}
              className="text-blue-600 hover:text-blue-700"
              title="Add List"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          {lists.map((list) => (
            <button
              key={list.id}
              onClick={() => onViewChange(`list-${list.id}`)}
              className={`w-full flex items-center justify-between px-3 py-2 mx-4 rounded-lg mb-1 transition-colors ${
                activeView === `list-${list.id}`
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span>{list.icon}</span>
                <span className="font-medium">{list.name}</span>
              </div>
              {(list.taskCount || 0) > 0 && (
                <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                  {list.taskCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filter Views */}
        <div className="py-4 border-t border-gray-200">
          <div className="px-4 mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase">Filters</h3>
          </div>
          {filterViews.map((view) => (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`w-full flex items-center justify-between px-3 py-2 mx-4 rounded-lg mb-1 transition-colors ${
                activeView === view.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span>{view.icon}</span>
                <span className="font-medium">{view.name}</span>
              </div>
              {view.count > 0 && (
                <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                  {view.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* New List Modal */}
      {showNewListModal && (
        <NewListModal
          onClose={() => setShowNewListModal(false)}
          onSave={createList}
        />
      )}
    </div>
  );
}

function NewListModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (name: string, icon: string, color: string) => void;
}) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📋');
  const [color, setColor] = useState('#3B82F6');

  const icons = ['📋', '📝', '💼', '🎯', '🏠', '🎓', '💪', '🛒', '✈️', '🎨'];
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];

  const handleSave = () => {
    if (name.trim()) {
      onSave(name, icon, color);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">New List</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="List name"
            autoFocus
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
          <div className="flex flex-wrap gap-2">
            {icons.map((i) => (
              <button
                key={i}
                onClick={() => setIcon(i)}
                className={`text-2xl p-2 rounded-lg ${
                  icon === i ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-lg ${
                  color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
