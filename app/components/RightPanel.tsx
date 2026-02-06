'use client';

import { useState, useEffect } from 'react';
import { getSingaporeNow, formatSingaporeDate } from '@/lib/timezone';

interface Subtask {
  id: number;
  title: string;
  completed: boolean;
  position: number;
}

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface Todo {
  id: number;
  list_id: number | null;
  title: string;
  completed: boolean;
  due_date: string | null;
  priority: 'high' | 'medium' | 'low';
  is_recurring: boolean;
  recurrence_pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  reminder_minutes: number | null;
  subtasks: Subtask[];
  tags: Tag[];
  created_at: string;
}

interface TimeBlock {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  color: string;
}

interface RightPanelProps {
  selectedTask: Todo | null;
  onClose: () => void;
  onUpdate: () => void;
}

export function RightPanel({ selectedTask, onClose, onUpdate }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<'detail' | 'timeline'>('detail');
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [currentTime, setCurrentTime] = useState(getSingaporeNow());

  useEffect(() => {
    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(getSingaporeNow());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'timeline') {
      fetchTimeBlocks();
    }
  }, [activeTab]);

  const fetchTimeBlocks = async () => {
    try {
      const response = await fetch('/api/todos');
      if (response.ok) {
        const todos = await response.json();
        const today = getSingaporeNow().toISODate()!;
        
        // Convert todos with time to time blocks
        const blocks: TimeBlock[] = todos
          .filter((t: Todo) => t.due_date && t.due_date.includes('T'))
          .map((t: Todo) => {
            const dueDate = new Date(t.due_date!);
            const startTime = `${dueDate.getHours().toString().padStart(2, '0')}:${dueDate.getMinutes().toString().padStart(2, '0')}`;
            const endTime = calculateEndTime(startTime, 60); // Default 1 hour
            return {
              id: t.id,
              title: t.title,
              startTime,
              endTime,
              duration: 60,
              color: getPriorityColor(t.priority),
            };
          });
        
        setTimeBlocks(blocks);
      }
    } catch (error) {
      console.error('Error fetching time blocks:', error);
    }
  };

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#3B82F6';
    }
  };

  const getCurrentTimePosition = (): number => {
    const hours = currentTime.hour;
    const minutes = currentTime.minute;
    return (hours * 60 + minutes) / (24 * 60) * 100;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('detail')}
          className={`flex-1 px-4 py-3 text-sm font-medium ${
            activeTab === 'detail'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Task Detail
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 px-4 py-3 text-sm font-medium ${
            activeTab === 'timeline'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Timeline
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'detail' ? (
          <TaskDetailView
            task={selectedTask}
            onClose={onClose}
            onUpdate={onUpdate}
          />
        ) : (
          <TimelineView
            timeBlocks={timeBlocks}
            currentTime={currentTime}
            getCurrentTimePosition={getCurrentTimePosition}
          />
        )}
      </div>
    </div>
  );
}

function TaskDetailView({
  task,
  onClose,
  onUpdate,
}: {
  task: Todo | null;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDueDate(task.due_date || '');
      setPriority(task.priority);
      fetchSubtasks();
    }
  }, [task]);

  const fetchSubtasks = async () => {
    if (!task) return;
    try {
      const response = await fetch(`/api/todos/${task.id}/subtasks`);
      if (response.ok) {
        const data = await response.json();
        setSubtasks(data);
      }
    } catch (error) {
      console.error('Error fetching subtasks:', error);
    }
  };

  const updateTask = async (updates: Partial<Todo>) => {
    if (!task) return;
    try {
      const response = await fetch(`/api/todos/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async () => {
    if (!task || !confirm('Delete this task?')) return;
    try {
      const response = await fetch(`/api/todos/${task.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        onClose();
        onUpdate();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const addSubtask = async () => {
    if (!task || !newSubtaskTitle.trim()) return;
    try {
      const response = await fetch(`/api/todos/${task.id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSubtaskTitle, position: subtasks.length }),
      });
      if (response.ok) {
        setNewSubtaskTitle('');
        await fetchSubtasks();
        onUpdate();
      }
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  const toggleSubtask = async (subtaskId: number, completed: boolean) => {
    if (!task) return;
    try {
      const response = await fetch(`/api/todos/${task.id}/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });
      if (response.ok) {
        await fetchSubtasks();
        onUpdate();
      }
    } catch (error) {
      console.error('Error toggling subtask:', error);
    }
  };

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
        <p className="text-lg font-medium">Select a task</p>
        <p className="text-sm text-center mt-2">
          Click on a task from the list to view and edit its details
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <button
          onClick={() => updateTask({ completed: !task.completed })}
          className={`mt-1 w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all ${
            task.completed
              ? 'bg-blue-500 border-blue-500'
              : 'border-gray-300 hover:border-blue-500'
          }`}
        >
          {task.completed && (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
        <div className="flex space-x-2">
          <button
            onClick={deleteTask}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            title="Delete"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Title */}
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => updateTask({ title })}
          className="w-full text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
        />
      </div>

      {/* Due Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => {
            setDueDate(e.target.value);
            updateTask({ due_date: e.target.value || null });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
        <div className="flex space-x-2">
          {(['high', 'medium', 'low'] as const).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPriority(p);
                updateTask({ priority: p });
              }}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                priority === p
                  ? p === 'high'
                    ? 'bg-red-100 text-red-700 ring-2 ring-red-500'
                    : p === 'medium'
                    ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-500'
                    : 'bg-green-100 text-green-700 ring-2 ring-green-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Subtasks */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Subtasks</label>
        <div className="space-y-2">
          {subtasks.map((subtask) => (
            <div key={subtask.id} className="flex items-center space-x-2">
              <button
                onClick={() => toggleSubtask(subtask.id, subtask.completed)}
                className={`w-4 h-4 rounded border-2 flex-shrink-0 ${
                  subtask.completed
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-gray-300 hover:border-blue-500'
                }`}
              >
                {subtask.completed && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
              <span
                className={`text-sm ${
                  subtask.completed ? 'line-through text-gray-400' : 'text-gray-900'
                }`}
              >
                {subtask.title}
              </span>
            </div>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addSubtask();
            }}
            className="flex items-center space-x-2 mt-2"
          >
            <button type="submit" className="w-4 h-4 rounded border-2 border-gray-300 flex-shrink-0" />
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Add subtask"
              className="flex-1 text-sm focus:outline-none"
            />
          </form>
        </div>
      </div>

      {/* Metadata */}
      <div className="pt-4 border-t border-gray-200 text-xs text-gray-500 space-y-1">
        <p>Created: {formatSingaporeDate(task.created_at, 'MMM d, yyyy HH:mm')}</p>
        {task.is_recurring && (
          <p>Recurrence: {task.recurrence_pattern}</p>
        )}
      </div>
    </div>
  );
}

function TimelineView({
  timeBlocks,
  currentTime,
  getCurrentTimePosition,
}: {
  timeBlocks: TimeBlock[];
  currentTime: any;
  getCurrentTimePosition: () => number;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="relative">
      {/* Current Time Indicator */}
      <div
        className="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
        style={{ top: `${getCurrentTimePosition()}%` }}
      >
        <div className="absolute -left-2 -top-1 w-4 h-4 bg-red-500 rounded-full" />
        <span className="absolute -left-14 -top-2 text-xs font-medium text-red-500">
          {currentTime.hour.toString().padStart(2, '0')}:
          {currentTime.minute.toString().padStart(2, '0')}
        </span>
      </div>

      {/* Timeline Grid */}
      <div className="p-4">
        {hours.map((hour) => (
          <div key={hour} className="relative h-16 border-b border-gray-100">
            <span className="absolute -left-2 -top-2 text-xs text-gray-500 w-12 text-right">
              {hour.toString().padStart(2, '0')}:00
            </span>
            
            {/* Time Blocks for this hour */}
            {timeBlocks
              .filter((block) => {
                const blockHour = parseInt(block.startTime.split(':')[0]);
                return blockHour === hour;
              })
              .map((block) => (
                <div
                  key={block.id}
                  className="absolute left-14 right-4 rounded-lg px-3 py-1 text-white text-xs font-medium shadow-sm"
                  style={{
                    backgroundColor: block.color,
                    height: `${(block.duration / 60) * 4}rem`,
                    top: `${(parseInt(block.startTime.split(':')[1]) / 60) * 4}rem`,
                  }}
                >
                  {block.title}
                  <div className="text-xs opacity-75 mt-0.5">
                    {block.startTime} - {block.endTime}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
