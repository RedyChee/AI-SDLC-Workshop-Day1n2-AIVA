import { describe, it, expect } from 'vitest'

describe('Tag Name Validation', () => {
  const validateTagName = (name: string): boolean => {
    if (!name || typeof name !== 'string') return false
    const trimmed = name.trim()
    if (trimmed.length === 0) return false
    if (trimmed.length > 50) return false
    return true
  }

  describe('Valid tag names', () => {
    it('should accept simple tag names', () => {
      expect(validateTagName('Work')).toBe(true)
      expect(validateTagName('Personal')).toBe(true)
      expect(validateTagName('Home')).toBe(true)
    })

    it('should accept tag names with spaces', () => {
      expect(validateTagName('Work Project')).toBe(true)
      expect(validateTagName('Home Improvement')).toBe(true)
    })

    it('should accept tag names with numbers', () => {
      expect(validateTagName('Project 2026')).toBe(true)
      expect(validateTagName('Q1 Goals')).toBe(true)
    })

    it('should accept tag names with special characters', () => {
      expect(validateTagName('Work-Life')).toBe(true)
      expect(validateTagName('To-Do')).toBe(true)
      expect(validateTagName('Work_Task')).toBe(true)
    })

    it('should trim whitespace from valid names', () => {
      expect(validateTagName('  Work  ')).toBe(true)
      expect(validateTagName('\tHome\t')).toBe(true)
    })
  })

  describe('Invalid tag names', () => {
    it('should reject empty strings', () => {
      expect(validateTagName('')).toBe(false)
    })

    it('should reject whitespace-only strings', () => {
      expect(validateTagName('   ')).toBe(false)
      expect(validateTagName('\t\t')).toBe(false)
      expect(validateTagName('\n\n')).toBe(false)
    })

    it('should reject names longer than 50 characters', () => {
      const longName = 'a'.repeat(51)
      expect(validateTagName(longName)).toBe(false)
    })

    it('should reject non-string values', () => {
      expect(validateTagName(null as any)).toBe(false)
      expect(validateTagName(undefined as any)).toBe(false)
      expect(validateTagName(123 as any)).toBe(false)
      expect(validateTagName({} as any)).toBe(false)
      expect(validateTagName([] as any)).toBe(false)
    })
  })

  describe('Edge cases', () => {
    it('should accept exactly 50 characters', () => {
      const name = 'a'.repeat(50)
      expect(validateTagName(name)).toBe(true)
    })

    it('should accept single character', () => {
      expect(validateTagName('A')).toBe(true)
    })

    it('should accept unicode characters', () => {
      expect(validateTagName('工作')).toBe(true)
      expect(validateTagName('Работа')).toBe(true)
      expect(validateTagName('العمل')).toBe(true)
    })
  })
})

describe('Subtasks JSON Serialization', () => {
  interface Subtask {
    title: string
    position: number
  }

  const serializeSubtasks = (subtasks: Subtask[]): string => {
    return JSON.stringify(subtasks)
  }

  const deserializeSubtasks = (json: string): Subtask[] => {
    if (!json) return []
    try {
      return JSON.parse(json)
    } catch {
      return []
    }
  }

  describe('Serialization', () => {
    it('should serialize empty array', () => {
      const result = serializeSubtasks([])
      expect(result).toBe('[]')
    })

    it('should serialize single subtask', () => {
      const subtasks = [{ title: 'Subtask 1', position: 0 }]
      const result = serializeSubtasks(subtasks)
      expect(result).toBe('[{"title":"Subtask 1","position":0}]')
    })

    it('should serialize multiple subtasks', () => {
      const subtasks = [
        { title: 'Subtask 1', position: 0 },
        { title: 'Subtask 2', position: 1 },
        { title: 'Subtask 3', position: 2 },
      ]
      const result = serializeSubtasks(subtasks)
      const parsed = JSON.parse(result)
      expect(parsed).toHaveLength(3)
      expect(parsed[0].title).toBe('Subtask 1')
      expect(parsed[2].position).toBe(2)
    })

    it('should handle special characters in titles', () => {
      const subtasks = [{ title: 'Review "code" & test', position: 0 }]
      const result = serializeSubtasks(subtasks)
      const parsed = JSON.parse(result)
      expect(parsed[0].title).toBe('Review "code" & test')
    })

    it('should handle unicode characters', () => {
      const subtasks = [{ title: '完成任务', position: 0 }]
      const result = serializeSubtasks(subtasks)
      const parsed = JSON.parse(result)
      expect(parsed[0].title).toBe('完成任务')
    })
  })

  describe('Deserialization', () => {
    it('should deserialize empty array', () => {
      const result = deserializeSubtasks('[]')
      expect(result).toEqual([])
    })

    it('should deserialize single subtask', () => {
      const json = '[{"title":"Subtask 1","position":0}]'
      const result = deserializeSubtasks(json)
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Subtask 1')
      expect(result[0].position).toBe(0)
    })

    it('should deserialize multiple subtasks', () => {
      const json = '[{"title":"Task 1","position":0},{"title":"Task 2","position":1}]'
      const result = deserializeSubtasks(json)
      expect(result).toHaveLength(2)
      expect(result[1].title).toBe('Task 2')
    })

    it('should handle empty string', () => {
      const result = deserializeSubtasks('')
      expect(result).toEqual([])
    })

    it('should handle invalid JSON gracefully', () => {
      const result = deserializeSubtasks('not valid json')
      expect(result).toEqual([])
    })

    it('should handle malformed JSON gracefully', () => {
      const result = deserializeSubtasks('[{invalid}]')
      expect(result).toEqual([])
    })
  })

  describe('Round-trip', () => {
    it('should maintain data through round-trip', () => {
      const original = [
        { title: 'Task 1', position: 0 },
        { title: 'Task 2', position: 1 },
      ]
      const serialized = serializeSubtasks(original)
      const deserialized = deserializeSubtasks(serialized)
      expect(deserialized).toEqual(original)
    })

    it('should preserve order', () => {
      const original = [
        { title: 'Third', position: 2 },
        { title: 'First', position: 0 },
        { title: 'Second', position: 1 },
      ]
      const serialized = serializeSubtasks(original)
      const deserialized = deserializeSubtasks(serialized)
      expect(deserialized[0].title).toBe('Third')
      expect(deserialized[1].title).toBe('First')
    })
  })
})

describe('ID Remapping Logic', () => {
  interface ImportData {
    todos: Array<{ id: string; title: string; tag_ids?: string[] }>
    tags: Array<{ id: string; name: string }>
  }

  const remapIds = (data: ImportData): { todos: any[]; tagMap: Map<string, string> } => {
    const tagMap = new Map<string, string>()
    let tagCounter = 1
    let todoCounter = 1

    // Remap tag IDs
    data.tags?.forEach(tag => {
      const newId = `tag-${tagCounter++}`
      tagMap.set(tag.id, newId)
    })

    // Remap todo IDs and tag references
    const remappedTodos = data.todos.map(todo => {
      const newTodo = {
        ...todo,
        id: `todo-${todoCounter++}`,
        tag_ids: todo.tag_ids?.map(oldTagId => tagMap.get(oldTagId) || oldTagId),
      }
      return newTodo
    })

    return { todos: remappedTodos, tagMap }
  }

  describe('Tag ID remapping', () => {
    it('should remap single tag ID', () => {
      const data = {
        todos: [],
        tags: [{ id: 'old-tag-1', name: 'Work' }],
      }
      const { tagMap } = remapIds(data)
      expect(tagMap.get('old-tag-1')).toBe('tag-1')
    })

    it('should remap multiple tag IDs', () => {
      const data = {
        todos: [],
        tags: [
          { id: 'old-tag-1', name: 'Work' },
          { id: 'old-tag-2', name: 'Home' },
          { id: 'old-tag-3', name: 'Personal' },
        ],
      }
      const { tagMap } = remapIds(data)
      expect(tagMap.get('old-tag-1')).toBe('tag-1')
      expect(tagMap.get('old-tag-2')).toBe('tag-2')
      expect(tagMap.get('old-tag-3')).toBe('tag-3')
    })

    it('should handle empty tags array', () => {
      const data = { todos: [], tags: [] }
      const { tagMap } = remapIds(data)
      expect(tagMap.size).toBe(0)
    })
  })

  describe('Todo ID remapping', () => {
    it('should remap single todo ID', () => {
      const data = {
        todos: [{ id: 'old-todo-1', title: 'Task 1' }],
        tags: [],
      }
      const { todos } = remapIds(data)
      expect(todos[0].id).toBe('todo-1')
    })

    it('should remap multiple todo IDs', () => {
      const data = {
        todos: [
          { id: 'old-todo-1', title: 'Task 1' },
          { id: 'old-todo-2', title: 'Task 2' },
          { id: 'old-todo-3', title: 'Task 3' },
        ],
        tags: [],
      }
      const { todos } = remapIds(data)
      expect(todos[0].id).toBe('todo-1')
      expect(todos[1].id).toBe('todo-2')
      expect(todos[2].id).toBe('todo-3')
    })
  })

  describe('Tag reference remapping', () => {
    it('should remap tag references in todos', () => {
      const data = {
        todos: [{ id: 'old-todo-1', title: 'Task 1', tag_ids: ['old-tag-1'] }],
        tags: [{ id: 'old-tag-1', name: 'Work' }],
      }
      const { todos } = remapIds(data)
      expect(todos[0].tag_ids).toEqual(['tag-1'])
    })

    it('should remap multiple tag references', () => {
      const data = {
        todos: [{ id: 'old-todo-1', title: 'Task 1', tag_ids: ['old-tag-1', 'old-tag-2'] }],
        tags: [
          { id: 'old-tag-1', name: 'Work' },
          { id: 'old-tag-2', name: 'Home' },
        ],
      }
      const { todos } = remapIds(data)
      expect(todos[0].tag_ids).toEqual(['tag-1', 'tag-2'])
    })

    it('should handle todos without tags', () => {
      const data = {
        todos: [{ id: 'old-todo-1', title: 'Task 1' }],
        tags: [],
      }
      const { todos } = remapIds(data)
      expect(todos[0].tag_ids).toBeUndefined()
    })
  })

  describe('Complex scenarios', () => {
    it('should handle multiple todos with shared tags', () => {
      const data = {
        todos: [
          { id: 'old-todo-1', title: 'Task 1', tag_ids: ['old-tag-1'] },
          { id: 'old-todo-2', title: 'Task 2', tag_ids: ['old-tag-1', 'old-tag-2'] },
          { id: 'old-todo-3', title: 'Task 3', tag_ids: ['old-tag-2'] },
        ],
        tags: [
          { id: 'old-tag-1', name: 'Work' },
          { id: 'old-tag-2', name: 'Home' },
        ],
      }
      const { todos } = remapIds(data)
      expect(todos[0].tag_ids).toEqual(['tag-1'])
      expect(todos[1].tag_ids).toEqual(['tag-1', 'tag-2'])
      expect(todos[2].tag_ids).toEqual(['tag-2'])
    })

    it('should maintain data integrity', () => {
      const data = {
        todos: [
          { id: 'old-todo-1', title: 'Important Task', tag_ids: ['old-tag-1'] },
        ],
        tags: [{ id: 'old-tag-1', name: 'Work' }],
      }
      const { todos } = remapIds(data)
      expect(todos[0].title).toBe('Important Task')
      expect(todos[0].id).toBe('todo-1')
      expect(todos[0].tag_ids).toEqual(['tag-1'])
    })
  })
})
