'use client'

import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { FontSize } from '@tiptap/extension-font-size'
import { Button } from './button'
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  List, 
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Palette
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const fontSizes = [
  { label: 'Маленький', value: '12px' },
  { label: 'Обычный', value: '16px' },
  { label: 'Средний', value: '18px' },
  { label: 'Большой', value: '24px' },
  { label: 'Очень большой', value: '32px' },
]

const colors = [
  { label: 'Черный', value: '#000000' },
  { label: 'Красный', value: '#dc2626' },
  { label: 'Зеленый', value: '#16a34a' },
  { label: 'Синий', value: '#2563eb' },
  { label: 'Оранжевый', value: '#ea580c' },
  { label: 'Фиолетовый', value: '#7c3aed' },
  { label: 'Серый', value: '#6b7280' },
]

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Введите текст...',
  className = ''
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontSize,
    ],
    content: mounted ? value : '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
    immediatelyRender: false,
  })

  // Обновляем содержимое редактора при изменении value
  useEffect(() => {
    if (editor && mounted && value !== editor.getHTML()) {
      // Временно отключаем onUpdate чтобы избежать цикла
      const originalOnUpdate = editor.options.onUpdate
      editor.options.onUpdate = undefined
      
      editor.commands.setContent(value)
      
      // Восстанавливаем onUpdate
      setTimeout(() => {
        editor.options.onUpdate = originalOnUpdate
      }, 0)
    }
  }, [editor, mounted, value])

  if (!mounted || !editor) {
    return (
      <div className={`border rounded-lg ${className}`}>
        <div className="border-b bg-gray-50 p-2">
          <div className="text-sm text-gray-500">Загрузка редактора...</div>
        </div>
        <div className="p-4 min-h-[200px]">
          <div className="min-h-[180px] bg-gray-50 rounded"></div>
        </div>
      </div>
    )
  }

  const setFontSize = (size: string) => {
    editor.chain().focus().setFontSize(size).run()
  }

  const setColor = (color: string) => {
    editor.chain().focus().setColor(color).run()
  }

  return (
    <div className={`border rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r pr-2">
          <Button
            variant={editor.isActive('bold') ? 'default' : 'outline'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Жирный"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('italic') ? 'default' : 'outline'}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Курсив"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('strike') ? 'default' : 'outline'}
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Зачеркнутый"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('underline') ? 'default' : 'outline'}
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Подчеркнутый"
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r pr-2">
          <Button
            variant={editor.isActive('bulletList') ? 'default' : 'outline'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Маркированный список"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('orderedList') ? 'default' : 'outline'}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Нумерованный список"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 border-r pr-2">
          <Button
            variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'outline'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            title="По левому краю"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'outline'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            title="По центру"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'outline'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            title="По правому краю"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'outline'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            title="По ширине"
          >
            <AlignJustify className="h-4 w-4" />
          </Button>
        </div>

        {/* Font Size */}
        <div className="flex items-center gap-1 border-r pr-2">
          <Type className="h-4 w-4 text-gray-500" />
          <select
            className="text-xs border rounded px-1 py-1"
            onChange={(e) => setFontSize(e.target.value)}
            value={editor.getAttributes('textStyle').fontSize || '16px'}
          >
            {fontSizes.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>

        {/* Color */}
        <div className="flex items-center gap-1">
          <Palette className="h-4 w-4 text-gray-500" />
          <select
            className="text-xs border rounded px-1 py-1"
            onChange={(e) => setColor(e.target.value)}
            value={editor.getAttributes('textStyle').color || '#000000'}
          >
            {colors.map((color) => (
              <option key={color.value} value={color.value}>
                {color.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Editor Content */}
      <div className="p-4 min-h-[200px]">
        <EditorContent 
          editor={editor} 
          className="min-h-[180px] focus:outline-none"
        />
      </div>
    </div>
  )
} 