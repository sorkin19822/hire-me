<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Underline,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Placeholder.configure({ placeholder: props.placeholder ?? 'Введіть текст...' }),
  ],
  onUpdate ({ editor }) {
    emit('update:modelValue', editor.getHTML())
  },
})

watch(() => props.modelValue, (val) => {
  if (editor.value && editor.value.getHTML() !== val) {
    editor.value.commands.setContent(val, false)
  }
})

onBeforeUnmount(() => editor.value?.destroy())
</script>

<template>
  <div class="rich-editor border border-[oklch(92.03%_0.015_260.73)] dark:border-[oklch(36.67%_0.041_262.29)] rounded-[7px] overflow-hidden">
    <!-- Toolbar -->
    <div class="flex flex-wrap gap-0.5 p-1.5 border-b border-[oklch(92.03%_0.015_260.73)] dark:border-[oklch(36.67%_0.041_262.29)] bg-[oklch(98.07%_0.005_247.88)] dark:bg-[oklch(27.84%_0.027_257.53)]">
      <!-- Bold -->
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor?.isActive('bold') }"
        @click="editor?.chain().focus().toggleBold().run()"
      >
        <UIcon name="i-lucide-bold" class="w-4 h-4" />
      </button>
      <!-- Italic -->
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor?.isActive('italic') }"
        @click="editor?.chain().focus().toggleItalic().run()"
      >
        <UIcon name="i-lucide-italic" class="w-4 h-4" />
      </button>
      <!-- Underline -->
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor?.isActive('underline') }"
        @click="editor?.chain().focus().toggleUnderline().run()"
      >
        <UIcon name="i-lucide-underline" class="w-4 h-4" />
      </button>

      <div class="w-px bg-gray-200 dark:bg-gray-600 mx-0.5" />

      <!-- H2 -->
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor?.isActive('heading', { level: 2 }) }"
        @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
      >
        <UIcon name="i-lucide-heading-2" class="w-4 h-4" />
      </button>
      <!-- H3 -->
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor?.isActive('heading', { level: 3 }) }"
        @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
      >
        <UIcon name="i-lucide-heading-3" class="w-4 h-4" />
      </button>

      <div class="w-px bg-gray-200 dark:bg-gray-600 mx-0.5" />

      <!-- Bullet list -->
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor?.isActive('bulletList') }"
        @click="editor?.chain().focus().toggleBulletList().run()"
      >
        <UIcon name="i-lucide-list" class="w-4 h-4" />
      </button>
      <!-- Ordered list -->
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor?.isActive('orderedList') }"
        @click="editor?.chain().focus().toggleOrderedList().run()"
      >
        <UIcon name="i-lucide-list-ordered" class="w-4 h-4" />
      </button>

      <div class="w-px bg-gray-200 dark:bg-gray-600 mx-0.5" />

      <!-- Blockquote -->
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor?.isActive('blockquote') }"
        @click="editor?.chain().focus().toggleBlockquote().run()"
      >
        <UIcon name="i-lucide-quote" class="w-4 h-4" />
      </button>
      <!-- Code -->
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor?.isActive('code') }"
        @click="editor?.chain().focus().toggleCode().run()"
      >
        <UIcon name="i-lucide-code" class="w-4 h-4" />
      </button>

      <div class="w-px bg-gray-200 dark:bg-gray-600 mx-0.5" />

      <!-- Undo -->
      <button
        type="button"
        class="toolbar-btn"
        :disabled="!editor?.can().undo()"
        @click="editor?.chain().focus().undo().run()"
      >
        <UIcon name="i-lucide-undo" class="w-4 h-4" />
      </button>
      <!-- Redo -->
      <button
        type="button"
        class="toolbar-btn"
        :disabled="!editor?.can().redo()"
        @click="editor?.chain().focus().redo().run()"
      >
        <UIcon name="i-lucide-redo" class="w-4 h-4" />
      </button>
    </div>

    <!-- Editor content -->
    <EditorContent :editor="editor" class="prose-editor" />
  </div>
</template>

<style scoped>
.toolbar-btn {
  @apply p-1.5 rounded text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)] hover:bg-white dark:hover:bg-[oklch(32%_0.03_260)] hover:text-primary transition-colors;
}
.toolbar-btn.active {
  @apply bg-primary/10 text-primary;
}
.toolbar-btn:disabled {
  @apply opacity-40 cursor-not-allowed;
}
</style>
