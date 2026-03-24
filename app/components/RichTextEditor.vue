<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

interface ToolbarButton {
  icon: string
  action: string
  attrs?: Record<string, unknown>
}

interface ToolbarGroup {
  buttons: ToolbarButton[]
}

const TOOLBAR: ToolbarGroup[] = [
  {
    buttons: [
      { icon: 'i-lucide-bold', action: 'bold' },
      { icon: 'i-lucide-italic', action: 'italic' },
      { icon: 'i-lucide-underline', action: 'underline' },
    ],
  },
  {
    buttons: [
      { icon: 'i-lucide-heading-2', action: 'heading', attrs: { level: 2 } },
      { icon: 'i-lucide-heading-3', action: 'heading', attrs: { level: 3 } },
    ],
  },
  {
    buttons: [
      { icon: 'i-lucide-list', action: 'bulletList' },
      { icon: 'i-lucide-list-ordered', action: 'orderedList' },
    ],
  },
  {
    buttons: [
      { icon: 'i-lucide-quote', action: 'blockquote' },
      { icon: 'i-lucide-code', action: 'code' },
    ],
  },
]

const HISTORY: ToolbarButton[] = [
  { icon: 'i-lucide-undo', action: 'undo' },
  { icon: 'i-lucide-redo', action: 'redo' },
]

const editor = useEditor({
  content: props.modelValue,
  extensions: [StarterKit, Underline],
  onUpdate({ editor }) {
    emit('update:modelValue', editor.getHTML())
  },
})

watch(() => props.modelValue, (val) => {
  if (editor.value && editor.value.getHTML() !== val) {
    editor.value.commands.setContent(val, false)
  }
})

onBeforeUnmount(() => editor.value?.destroy())

function isActive(btn: ToolbarButton): boolean {
  return !!editor.value?.isActive(btn.action, btn.attrs)
}

function run(btn: ToolbarButton) {
  const chain = editor.value?.chain().focus() as Record<string, (a?: unknown) => { run(): void }> | undefined
  if (!chain) return
  const method = `toggle${btn.action.charAt(0).toUpperCase()}${btn.action.slice(1)}`
  chain[method]?.(btn.attrs)?.run()
}

function canHistory(action: string): boolean {
  return action === 'undo' ? !!editor.value?.can().undo() : !!editor.value?.can().redo()
}

function runHistory(action: string) {
  const chain = editor.value?.chain().focus() as Record<string, () => { run(): void }> | undefined
  chain?.[action]?.()?.run()
}

function btnProps(active: boolean) {
  return {
    size: 'xs' as const,
    square: true,
    color: (active ? 'primary' : 'neutral') as 'primary' | 'neutral',
    variant: (active ? 'soft' : 'ghost') as 'soft' | 'ghost',
  }
}
</script>

<template>
  <div class="border border-[oklch(92.03%_0.015_260.73)] dark:border-[oklch(36.67%_0.041_262.29)] rounded-[7px] overflow-hidden">
    <div class="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-[oklch(92.03%_0.015_260.73)] dark:border-[oklch(36.67%_0.041_262.29)] bg-[oklch(98.07%_0.005_247.88)] dark:bg-[oklch(27.84%_0.027_257.53)]">
      <template v-for="(group, gi) in TOOLBAR" :key="gi">
        <div v-if="gi > 0" class="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5" />
        <UButton
          v-for="btn in group.buttons"
          :key="btn.action + JSON.stringify(btn.attrs)"
          v-bind="btnProps(isActive(btn))"
          :icon="btn.icon"
          @click="run(btn)"
        />
      </template>

      <div class="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5" />

      <UButton
        v-for="btn in HISTORY"
        :key="btn.action"
        v-bind="btnProps(false)"
        :icon="btn.icon"
        :disabled="!canHistory(btn.action)"
        @click="runHistory(btn.action)"
      />
    </div>

    <EditorContent :editor="editor" class="prose-editor" />
  </div>
</template>
