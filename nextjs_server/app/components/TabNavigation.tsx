'use client'

interface TabNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex gap-4 border-b border-gray-200">
      <button
        onClick={() => onTabChange('list')}
        className={`px-4 py-2 font-medium ${
          activeTab === 'list'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        List
      </button>
      <button
        onClick={() => onTabChange('calendar')}
        className={`px-4 py-2 font-medium ${
          activeTab === 'calendar'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Calendar
      </button>
      <button
        onClick={() => onTabChange('templates')}
        className={`px-4 py-2 font-medium ${
          activeTab === 'templates'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Templates
      </button>
    </div>
  )
}
