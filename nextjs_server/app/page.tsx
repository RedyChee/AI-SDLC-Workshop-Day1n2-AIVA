'use client'

import { useState, useEffect, useCallback } from 'react'
import TodoList from './components/TodoList'
import TodoForm from './components/TodoForm'
import SearchBar from './components/SearchBar'
import CalendarView from './components/CalendarView'
import PriorityFilter from './components/PriorityFilter'
import { Template, TodoWithDetails, Tag } from '@/lib/types'
import { formatSingaporeDate, getSingaporeNow } from '@/lib/timezone'
import { useNotifications } from '@/lib/hooks/useNotifications'

type TabType = 'list' | 'calendar' | 'templates'

export default function Home() {
  const [todos, setTodos] = useState<TodoWithDetails[]>([])
  const [filteredTodos, setFilteredTodos] = useState<TodoWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [username, setUsername] = useState<string>('Guest')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all')
  const [tagFilter, setTagFilter] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('list')
  const [overdue, setOverdue] = useState(0)
  const [pending, setPending] = useState(0)
  const [completed, setCompleted] = useState(0)
  const [tags, setTags] = useState<Tag[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [holidays, setHolidays] = useState<{ date: string; name: string }[]>([])
  const [calendarMonth, setCalendarMonth] = useState(getSingaporeNow())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [notificationStatus, setNotificationStatus] = useState<'default' | 'granted' | 'denied'>('default')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const [tagName, setTagName] = useState('')
  const [tagColor, setTagColor] = useState('#2563eb')
  const [templateName, setTemplateName] = useState('')
  const [templateTitle, setTemplateTitle] = useState('')
  const [templatePriority, setTemplatePriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [templateCategory, setTemplateCategory] = useState('')
  const [templateOffset, setTemplateOffset] = useState('0')
  const [templateSubtasks, setTemplateSubtasks] = useState('')

  const selectedTodos = selectedDate
    ? todos.filter(todo => todo.due_date === selectedDate)
    : []
  const selectedHoliday = selectedDate
    ? holidays.find(holiday => holiday.date === selectedDate)
    : null

  useNotifications()

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/todos')
      if (!response.ok) throw new Error('Failed to fetch todos')
      const data = await response.json()

      const sortedTodos = (data.data || []).sort((a: TodoWithDetails, b: TodoWithDetails) => {
        const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
        if (priorityDiff !== 0) return priorityDiff

        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        }
        return 0
      })

      setTodos(sortedTodos)
      calculateStats(sortedTodos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch('/api/tags')
      if (!response.ok) return
      const data = await response.json()
      setTags(data.data || [])
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }, [])

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/templates')
      if (!response.ok) return
      const data = await response.json()
      setTemplates(data.data || [])
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    }
  }, [])

  const fetchHolidays = useCallback(async () => {
    try {
      const response = await fetch('/api/holidays')
      if (!response.ok) return
      const data = await response.json()
      setHolidays(data.data || [])
    } catch (error) {
      console.error('Failed to fetch holidays:', error)
    }
  }, [])

  const calculateStats = (todoList: TodoWithDetails[]) => {
    const today = formatSingaporeDate(getSingaporeNow())
    let overdueCount = 0
    let pendingCount = 0
    let completedCount = 0

    todoList.forEach(todo => {
      if (todo.is_completed) {
        completedCount++
      } else if (todo.due_date && todo.due_date < today) {
        overdueCount++
      } else {
        pendingCount++
      }
    })

    setOverdue(overdueCount)
    setPending(pendingCount)
    setCompleted(completedCount)
  }

  useEffect(() => {
    let filtered = todos
    const today = formatSingaporeDate(getSingaporeNow())

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(todo => todo.priority === priorityFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(todo => {
        if (statusFilter === 'completed') return todo.is_completed
        if (statusFilter === 'pending') return !todo.is_completed
        if (statusFilter === 'overdue') return !todo.is_completed && todo.due_date && todo.due_date < today
        return true
      })
    }

    if (tagFilter !== 'all') {
      filtered = filtered.filter(todo => todo.tags.some((tag: any) => tag.id === tagFilter))
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(todo =>
        todo.title.toLowerCase().includes(query) ||
        todo.description?.toLowerCase().includes(query) ||
        todo.tags.some((tag: any) => tag.name.toLowerCase().includes(query)) ||
        todo.subtasks.some((subtask: any) => subtask.title.toLowerCase().includes(query))
      )
    }

    setFilteredTodos(filtered)
  }, [todos, priorityFilter, statusFilter, tagFilter, searchQuery])

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearchQuery(searchInput)
    }, 300)

    return () => window.clearTimeout(id)
  }, [searchInput])

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    setNotificationStatus(Notification.permission as 'default' | 'granted' | 'denied')
  }, [])

  useEffect(() => {
    setUsername('abc')
    fetchTodos()
    fetchTags()
    fetchTemplates()
    fetchHolidays()
  }, [fetchTodos, fetchTags, fetchTemplates, fetchHolidays])

  const handleTodoAdded = () => {
    fetchTodos()
  }

  const handleTodoDeleted = () => {
    fetchTodos()
  }

  const handleTodoToggled = () => {
    fetchTodos()
  }

  const handleTodoUpdated = () => {
    fetchTodos()
  }

  const handleExport = async () => {
    setImportStatus(null)
    const response = await fetch('/api/todos/export')
    if (!response.ok) {
      setImportStatus('Export failed. Please try again.')
      return
    }
    const payload = await response.json()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `todos-export-${formatSingaporeDate(getSingaporeNow())}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (file: File | null) => {
    if (!file) return
    setImportStatus(null)

    let payload: any
    try {
      const text = await file.text()
      payload = JSON.parse(text)
    } catch {
      setImportStatus('Import failed: invalid JSON file.')
      return
    }

    const response = await fetch('/api/todos/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}))
      setImportStatus(errorPayload.error || 'Import failed.')
      return
    }

    const result = await response.json().catch(() => ({}))
    const todosCount = result.todos ?? 0
    const tagsCount = result.tags ?? 0
    const templatesCount = result.templates ?? 0
    setImportStatus(`Imported ${todosCount} todos, ${tagsCount} tags, ${templatesCount} templates.`)

    fetchTodos()
    fetchTags()
    fetchTemplates()
  }

  const handleCreateTag = async () => {
    if (!tagName.trim()) return
    const response = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: tagName.trim(), color: tagColor }),
    })
    if (response.ok) {
      setTagName('')
      fetchTags()
    }
  }

  const handleCreateTemplate = async () => {
    if (!templateName.trim() || !templateTitle.trim()) return
    const subtasks = templateSubtasks
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: templateName.trim(),
        title: templateTitle.trim(),
        priority: templatePriority,
        category: templateCategory.trim() || undefined,
        subtasks,
        due_date_offset_days: Number(templateOffset || '0'),
      }),
    })
    if (response.ok) {
      setTemplateName('')
      setTemplateTitle('')
      setTemplateCategory('')
      setTemplateOffset('0')
      setTemplateSubtasks('')
      fetchTemplates()
    }
  }

  const handleUseTemplate = async (templateId: string) => {
    const response = await fetch(`/api/templates/${templateId}/use`, { method: 'POST' })
    if (response.ok) {
      fetchTodos()
      setActiveTab('list')
    }
  }

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="card overflow-hidden">
          <header className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Todo App</h1>
              <p className="text-sm text-gray-600">Welcome, {username}</p>
            </div>
            <nav className="flex items-center gap-2">
              <button
                className={`px-3 py-2 rounded-lg font-medium text-sm ${
                  activeTab === 'list' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200'
                }`}
                onClick={() => setActiveTab('list')}
                data-testid="nav-list"
              >
                Data
              </button>
              <button
                className={`px-3 py-2 rounded-lg font-medium text-sm ${
                  activeTab === 'calendar' ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200'
                }`}
                onClick={() => setActiveTab('calendar')}
                data-testid="nav-calendar"
              >
                Calendar
              </button>
              <button
                className={`px-3 py-2 rounded-lg font-medium text-sm ${
                  activeTab === 'templates' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200'
                }`}
                onClick={() => setActiveTab('templates')}
                data-testid="nav-templates"
              >
                Templates
              </button>
              <button className="px-3 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 font-medium text-sm">
                Alerts
              </button>
              <button className="px-3 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-800 font-medium text-sm">
                Logout
              </button>
            </nav>
          </header>

          <div className="px-6 py-6 space-y-8">
            {activeTab === 'list' && (
              <>
                <div className="card p-6">
                  <TodoForm onTodoAdded={handleTodoAdded} tags={tags} />
                </div>

                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <SearchBar
                      searchQuery={searchInput}
                      onSearchChange={setSearchInput}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <PriorityFilter
                      currentFilter={priorityFilter}
                      onFilterChange={setPriorityFilter}
                    />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="input"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="overdue">Overdue</option>
                    </select>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    >
                      Advanced
                    </button>
                  </div>
                </div>

                {showAdvancedFilters && (
                  <div className="card p-4 flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Tag Filter</label>
                      <select
                        value={tagFilter}
                        onChange={(e) => setTagFilter(e.target.value)}
                        className="input"
                      >
                        <option value="all">All Tags</option>
                        {tags.map((tag: any) => (
                          <option key={tag.id} value={tag.id}>
                            {tag.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end gap-2">
                      <button className="btn btn-secondary" onClick={handleExport}>
                        Export
                      </button>
                      <label className="btn btn-secondary cursor-pointer">
                        Import
                        <input
                          type="file"
                          accept="application/json"
                          className="hidden"
                          onChange={(e) => handleImport(e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{overdue}</div>
                    <div className="text-gray-600 text-sm">Overdue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600" data-testid="pending-count">
                      {pending}
                    </div>
                    <div className="text-gray-600 text-sm">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600" data-testid="completed-count">
                      {completed}
                    </div>
                    <div className="text-gray-600 text-sm">Completed</div>
                  </div>
                </div>

                {filteredTodos.filter(t => !t.is_completed).length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-blue-600 mb-4">
                      Pending ({filteredTodos.filter(t => !t.is_completed).length})
                    </h2>
                    <TodoList
                      todos={filteredTodos.filter(t => !t.is_completed)}
                      availableTags={tags}
                      onTodoDeleted={handleTodoDeleted}
                      onTodoToggled={handleTodoToggled}
                      onTodoUpdated={handleTodoUpdated}
                    />
                  </div>
                )}

                {filteredTodos.filter(t => t.is_completed).length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-green-600 mb-4">
                      Completed ({filteredTodos.filter(t => t.is_completed).length})
                    </h2>
                    <TodoList
                      todos={filteredTodos.filter(t => t.is_completed)}
                      availableTags={tags}
                      onTodoDeleted={handleTodoDeleted}
                      onTodoToggled={handleTodoToggled}
                      onTodoUpdated={handleTodoUpdated}
                    />
                  </div>
                )}

                <div className="card p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Tag Manager</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      className="input flex-1"
                      placeholder="New tag name"
                      value={tagName}
                      onChange={(e) => setTagName(e.target.value)}
                      data-testid="tag-name-input"
                    />
                    <input
                      type="color"
                      value={tagColor}
                      onChange={(e) => setTagColor(e.target.value)}
                      className="h-10 w-14 rounded border border-gray-200"
                      data-testid="tag-color-input"
                    />
                    <button className="btn btn-primary" onClick={handleCreateTag} data-testid="tag-create">
                      Add Tag
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'calendar' && (
              <>
                <CalendarView
                  todos={todos}
                  holidays={holidays}
                  currentMonth={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  onDayClick={setSelectedDate}
                  selectedDateKey={selectedDate}
                />

                {selectedDate && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                    data-testid="calendar-modal"
                  >
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-semibold">{selectedDate}</div>
                        <button
                          className="text-sm text-gray-500 hover:text-gray-800"
                          onClick={() => setSelectedDate(null)}
                          data-testid="calendar-modal-close"
                        >
                          Close
                        </button>
                      </div>
                      {selectedHoliday && (
                        <div className="text-sm text-red-600 mb-2">
                          {selectedHoliday.name}
                        </div>
                      )}
                      {selectedTodos.length === 0 ? (
                        <div className="text-sm text-gray-600">No todos for this day.</div>
                      ) : (
                        <ul className="space-y-2 text-sm">
                          {selectedTodos.map(todo => (
                            <li key={todo.id} className="bg-blue-50 text-blue-700 px-3 py-2 rounded">
                              {todo.title}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'templates' && (
              <div className="space-y-6">
                <div className="card p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Create Template</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      className="input"
                      placeholder="Template name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      data-testid="template-name"
                    />
                    <input
                      className="input"
                      placeholder="Todo title"
                      value={templateTitle}
                      onChange={(e) => setTemplateTitle(e.target.value)}
                      data-testid="template-title"
                    />
                    <select
                      className="input"
                      value={templatePriority}
                      onChange={(e) => setTemplatePriority(e.target.value as 'low' | 'medium' | 'high')}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <input
                      className="input"
                      placeholder="Category (optional)"
                      value={templateCategory}
                      onChange={(e) => setTemplateCategory(e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Due date offset (days)"
                      value={templateOffset}
                      onChange={(e) => setTemplateOffset(e.target.value)}
                      data-testid="template-offset"
                    />
                    <input
                      className="input"
                      placeholder="Subtasks (comma-separated)"
                      value={templateSubtasks}
                      onChange={(e) => setTemplateSubtasks(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary" onClick={handleCreateTemplate} data-testid="template-create">
                    Save Template
                  </button>
                </div>

                <div className="space-y-3">
                  {templates.map((template: any) => (
                    <div key={template.id} className="card p-4 flex items-center justify-between" data-testid="template-item">
                      <div>
                        <div className="font-semibold">{template.name}</div>
                        <div className="text-sm text-gray-500">{template.title}</div>
                      </div>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleUseTemplate(template.id)}
                        data-testid="template-use"
                      >
                        Use
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading && <div className="text-center py-8 text-gray-600">Loading todos...</div>}
            {error && <div className="text-center py-8 text-red-600">{error}</div>}
          </div>
        </div>
      </div>
    </main>
  )
}
