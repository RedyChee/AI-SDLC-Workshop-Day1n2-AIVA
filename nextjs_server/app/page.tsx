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
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)
  const [showTagModal, setShowTagModal] = useState(false)
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [editTagName, setEditTagName] = useState('')
  const [editTagColor, setEditTagColor] = useState('#2563eb')

  const [tagName, setTagName] = useState('')
  const [tagColor, setTagColor] = useState('#2563eb')
  const [templateName, setTemplateName] = useState('')
  const [templateTitle, setTemplateTitle] = useState('')
  const [templatePriority, setTemplatePriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [templateCategory, setTemplateCategory] = useState('')
  const [templateOffset, setTemplateOffset] = useState('0')
  const [templateSubtasks, setTemplateSubtasks] = useState('')

  const activeTag = tags.find(tag => tag.id === tagFilter) || null
  const hasActiveFilters =
    priorityFilter !== 'all' ||
    statusFilter !== 'all' ||
    tagFilter !== 'all' ||
    searchQuery.trim().length > 0

  const selectedTodos = selectedDate
    ? todos.filter(todo => todo.due_date === selectedDate)
    : []
  const selectedHoliday = selectedDate
    ? holidays.find(holiday => holiday.date === selectedDate)
    : null

  useNotifications()

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission)
    }
  }, [])

  const handleEnableNotifications = async () => {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      setNotificationStatus(permission)
    }
  }

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

  const handleTagClick = (tagId: string) => {
    setTagFilter(tagId)
    setShowAdvancedFilters(true)
  }

  const handleClearFilters = () => {
    setPriorityFilter('all')
    setStatusFilter('all')
    setTagFilter('all')
    setSearchInput('')
    setSearchQuery('')
  }

  const startEditTag = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId)
    if (!tag) return
    setEditingTagId(tagId)
    setEditTagName(tag.name)
    setEditTagColor(tag.color)
  }

  const cancelEditTag = () => {
    setEditingTagId(null)
    setEditTagName('')
    setEditTagColor('#2563eb')
  }

  const handleSaveTag = async (tagId: string) => {
    const response = await fetch(`/api/tags/${tagId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editTagName.trim(), color: editTagColor }),
    })
    if (response.ok) {
      cancelEditTag()
      fetchTags()
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Delete this tag?')) return
    const response = await fetch(`/api/tags/${tagId}`, { method: 'DELETE' })
    if (response.ok) {
      if (tagFilter === tagId) setTagFilter('all')
      fetchTags()
      fetchTodos()
    }
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
                className={`px-3 py-2 rounded-lg font-medium text-sm inline-flex items-center gap-2 ${
                  activeTab === 'list' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200'
                }`}
                onClick={() => setActiveTab('list')}
                data-testid="nav-list"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <circle cx="5" cy="10" r="1.5" />
                    <circle cx="10" cy="10" r="1.5" />
                    <circle cx="15" cy="10" r="1.5" />
                  </svg>
                </span>
                Data
              </button>
              <button
                className={`px-3 py-2 rounded-lg font-medium text-sm inline-flex items-center gap-2 ${
                  activeTab === 'calendar' ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200'
                }`}
                onClick={() => setActiveTab('calendar')}
                data-testid="nav-calendar"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M6 2v2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H8V2H6zm10 7H4v7h12V9z" />
                  </svg>
                </span>
                Calendar
              </button>
              <button
                className={`px-3 py-2 rounded-lg font-medium text-sm inline-flex items-center gap-2 ${
                  activeTab === 'templates' || showTemplatesModal ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200'
                }`}
                onClick={() => {
                  setActiveTab('templates')
                  setShowTemplatesModal(true)
                }}
                data-testid="nav-templates"
              >
                <span className="inline-flex h-4 w-4 items-center justify-center">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M5 3h7l3 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm6 1.5V7h2.5L11 4.5z" />
                  </svg>
                </span>
                Templates
              </button>
              <div className="relative">
                <button
                  onClick={handleEnableNotifications}
                  className="px-3 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 font-medium text-sm"
                  aria-label="Enable browser notifications"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2z" />
                  </svg>
                </button>
                {notificationStatus !== 'granted' && (
                  <div className="absolute right-0 mt-2 w-64 rounded-md bg-gray-900 text-white text-xs px-3 py-2">
                    Enable browser notifications for reminders
                  </div>
                )}
              </div>
              <button className="px-3 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-800 font-medium text-sm">
                Logout
              </button>
            </nav>
          </header>

          <div className="px-6 py-6 space-y-8">
            {activeTab === 'list' && (
              <>
                <div className="card p-6">
                  <TodoForm
                    onTodoAdded={handleTodoAdded}
                    tags={tags}
                    templates={templates}
                    onUseTemplate={handleUseTemplate}
                  />
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
                      className="btn btn-secondary inline-flex items-center gap-2"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path d="M7 5l6 5-6 5V5z" />
                      </svg>
                      Advanced
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowTagModal(true)}
                      data-testid="manage-tags"
                    >
                      Manage Tags
                    </button>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="card p-3 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-600">Filters:</span>
                    {searchQuery.trim() && (
                      <button
                        className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs"
                        onClick={() => {
                          setSearchInput('')
                          setSearchQuery('')
                        }}
                      >
                        Search: {searchQuery}
                      </button>
                    )}
                    {priorityFilter !== 'all' && (
                      <button
                        className="px-2 py-1 rounded-full bg-purple-50 text-purple-700 text-xs"
                        onClick={() => setPriorityFilter('all')}
                      >
                        Priority: {priorityFilter}
                      </button>
                    )}
                    {statusFilter !== 'all' && (
                      <button
                        className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-xs"
                        onClick={() => setStatusFilter('all')}
                      >
                        Status: {statusFilter}
                      </button>
                    )}
                    {activeTag && (
                      <button
                        className="px-2 py-1 rounded-full text-xs"
                        style={{ backgroundColor: `${activeTag.color}22`, color: activeTag.color }}
                        onClick={() => setTagFilter('all')}
                      >
                        Tag: {activeTag.name}
                      </button>
                    )}
                    <button className="text-xs text-gray-600 ml-auto" onClick={handleClearFilters}>
                      Clear all
                    </button>
                  </div>
                )}

                <div className="flex justify-end gap-2 mb-4">
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

                {showAdvancedFilters && (
                  <div className="card p-4 flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Tag Filter</label>
                      <div className="flex items-center gap-2">
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
                        {tagFilter !== 'all' && (
                          <button className="text-xs text-gray-600" onClick={() => setTagFilter('all')}>
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {importStatus && (
                  <div className="text-sm text-gray-600" data-testid="import-status">
                    {importStatus}
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
                      onTagClick={handleTagClick}
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
                      onTagClick={handleTagClick}
                    />
                  </div>
                )}
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

      {/* Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">My Templates</h2>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                data-testid="templates-modal-close"
              >
                ×
              </button>
            </div>

            {templates.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No templates yet. Create a todo and save it as a template!
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template: any) => {
                  const subtaskCount = template.subtasks_json
                    ? JSON.parse(template.subtasks_json).length
                    : 0
                  return (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-4" data-testid="template-item">
                      <div className="font-semibold mb-1">{template.name}</div>
                      <div className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Title:</span> {template.title}
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">Priority:</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          template.priority === 'high' ? 'bg-red-100 text-red-700' :
                          template.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {template.priority?.charAt(0).toUpperCase() + template.priority?.slice(1)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">{subtaskCount}</div>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-primary text-sm"
                          onClick={() => {
                            handleUseTemplate(template.id)
                            setShowTemplatesModal(false)
                          }}
                          data-testid="template-use"
                        >
                          Use Template
                        </button>
                        <button
                          className="btn bg-red-500 text-white hover:bg-red-600 text-sm"
                          onClick={async () => {
                            if (confirm('Delete this template?')) {
                              await fetch(`/api/templates/${template.id}`, { method: 'DELETE' })
                              fetchTemplates()
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <button
              onClick={() => setShowTemplatesModal(false)}
              className="btn btn-secondary w-full mt-6"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Tag Manager Modal */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Manage Tags</h2>
              <button
                onClick={() => setShowTagModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                data-testid="tags-modal-close"
              >
                ×
              </button>
            </div>

            <div className="card p-4 mb-6">
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

            {tags.length === 0 ? (
              <div className="text-center py-10 text-gray-500">No tags yet.</div>
            ) : (
              <div className="space-y-3">
                {tags.map(tag => (
                  <div key={tag.id} className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: tag.color }} />
                      {editingTagId === tag.id ? (
                        <input
                          className="input"
                          value={editTagName}
                          onChange={(e) => setEditTagName(e.target.value)}
                        />
                      ) : (
                        <span className="font-medium">{tag.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingTagId === tag.id ? (
                        <>
                          <input
                            type="color"
                            value={editTagColor}
                            onChange={(e) => setEditTagColor(e.target.value)}
                            className="h-9 w-12 rounded border border-gray-200"
                          />
                          <button className="btn btn-primary text-sm" onClick={() => handleSaveTag(tag.id)}>
                            Save
                          </button>
                          <button className="btn btn-secondary text-sm" onClick={cancelEditTag}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-secondary text-sm" onClick={() => startEditTag(tag.id)}>
                            Edit
                          </button>
                          <button className="btn btn-danger text-sm" onClick={() => handleDeleteTag(tag.id)}>
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowTagModal(false)}
              className="btn btn-secondary w-full mt-6"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
