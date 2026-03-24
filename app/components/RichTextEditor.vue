<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Underline,
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
  <div class="border border-[oklch(92.03%_0.015_260.73)] dark:border-[oklch(36.67%_0.041_262.29)] rounded-[7px] overflow-hidden">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-[oklch(92.03%_0.015_260.73)] dark:border-[oklch(36.67%_0.041_262.29)] bg-[oklch(98.07%_0.005_247.88)] dark:bg-[oklch(27.84%_0.027_257.53)]">
      <UButton
        size="xs"
        :color="editor?.isActive('bold') ? 'primary' : 'neutral'"
        :variant="editor?.isActive('bold') ? 'soft' : 'ghost'"
        icon="i-lucide-bold"
        square
        @click="editor?.chain().focus().toggleBold().run()"
      />
      <UButton
        size="xs"
        :color="editor?.isActive('italic') ? 'primary' : 'neutral'"
        :variant="editor?.isActive('italic') ? 'soft' : 'ghost'"
        icon="i-lucide-italic"
        square
        @click="editor?.chain().focus().toggleItalic().run()"
      />
      <UButton
        size="xs"
        :color="editor?.isActive('underline') ? 'primary' : 'neutral'"
        :variant="editor?.isActive('underline') ? 'soft' : 'ghost'"
        icon="i-lucide-underline"
        square
        @click="editor?.chain().focus().toggleUnderline().run()"
      />

      <div class="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5" />

      <UButton
        size="xs"
        :color="editor?.isActive('heading', { level: 2 }) ? 'primary' : 'neutral'"
        :variant="editor?.isActive('heading', { level: 2 }) ? 'soft' : 'ghost'"
        icon="i-lucide-heading-2"
        square
        @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
      />
      <UButton
        size="xs"
        :color="editor?.isActive('heading', { level: 3 }) ? 'primary' : 'neutral'"
        :variant="editor?.isActive('heading', { level: 3 }) ? 'soft' : 'ghost'"
        icon="i-lucide-heading-3"
        square
        @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
      />

      <div class="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5" />

      <UButton
        size="xs"
        :color="editor?.isActive('bulletList') ? 'primary' : 'neutral'"
        :variant="editor?.isActive('bulletList') ? 'soft' : 'ghost'"
        icon="i-lucide-list"
        square
        @click="editor?.chain().focus().toggleBulletList().run()"
      />
      <UButton
        size="xs"
        :color="editor?.isActive('orderedList') ? 'primary' : 'neutral'"
        :variant="editor?.isActive('orderedList') ? 'soft' : 'ghost'"
        icon="i-lucide-list-ordered"
        square
        @click="editor?.chain().focus().toggleOrderedList().run()"
      />

      <div class="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5" />

      <UButton
        size="xs"
        :color="editor?.isActive('blockquote') ? 'primary' : 'neutral'"
        :variant="editor?.isActive('blockquote') ? 'soft' : 'ghost'"
        icon="i-lucide-quote"
        square
        @click="editor?.chain().focus().toggleBlockquote().run()"
      />
      <UButton
        size="xs"
        :color="editor?.isActive('code') ? 'primary' : 'neutral'"
        :variant="editor?.isActive('code') ? 'soft' : 'ghost'"
        icon="i-lucide-code"
        square
        @click="editor?.chain().focus().toggleCode().run()"
      />

      <div class="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5" />

      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-undo"
        square
        :disabled="!editor?.can().undo()"
        @click="editor?.chain().focus().undo().run()"
      />
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-redo"
        square
        :disabled="!editor?.can().redo()"
        @click="editor?.chain().focus().redo().run()"
      />
    </div>

    <!-- Editor content -->
    <EditorContent :editor="editor" class="prose-editor" />
  </div>
</template>
