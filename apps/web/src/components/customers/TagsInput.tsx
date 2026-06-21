'use client'

import { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface TagsInputProps {
  value:        string[]
  onChange:     (tags: string[]) => void
  placeholder?: string
}

export function TagsInput({ value, onChange, placeholder }: TagsInputProps) {
  const [input, setInput] = useState('')

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-')
    if (tag && !value.includes(tag) && value.length < 10) {
      onChange([...value, tag])
    }
    setInput('')
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2 min-h-[40px] rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 pl-2 pr-1">
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="rounded-sm hover:bg-secondary-foreground/20 p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => input.trim() && addTag(input)}
        placeholder={value.length === 0 ? (placeholder != null ? placeholder : 'ex: vip, recorrente...') : ''}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
      />
    </div>
  )
}
