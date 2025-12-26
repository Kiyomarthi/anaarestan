<script setup lang="ts">
import { ref, computed } from "vue";
import type { EditorToolbarItem } from "@nuxt/ui";
import {
  Table,
  TableRow,
  TableHeader,
  TableCell,
} from "@tiptap/extension-table";

import { Paragraph } from "@tiptap/extension-paragraph";
import { Text } from "@tiptap/extension-text";
import { TextAlign } from "@tiptap/extension-text-align";

const data = ref(null);

const value = defineModel<string>({
  default: "",
});

const extensions = [
  Paragraph,
  Text,
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
];

const items: EditorToolbarItem[][] = [
  [
    { kind: "undo", icon: "i-lucide-undo", tooltip: { text: "برگشت به عقب" } },
    { kind: "redo", icon: "i-lucide-redo", tooltip: { text: "جلو رفتن" } },
  ],
  [
    {
      icon: "i-lucide-heading",
      tooltip: { text: "تیترها" },
      items: [
        {
          kind: "heading",
          level: 2,
          icon: "i-lucide-heading-2",
          label: "تیتر ۲",
        },
        {
          kind: "heading",
          level: 3,
          icon: "i-lucide-heading-3",
          label: "تیتر ۳",
        },
        {
          kind: "heading",
          level: 4,
          icon: "i-lucide-heading-4",
          label: "تیتر ۴",
        },
        {
          kind: "heading",
          level: 5,
          icon: "i-lucide-heading-5",
          label: "تیتر 5",
        },
        {
          kind: "heading",
          level: 6,
          icon: "i-lucide-heading-6",
          label: "تیتر 6",
        },
      ],
    },
    {
      icon: "i-lucide-list",
      tooltip: { text: "لیست‌ها" },
      items: [
        {
          kind: "bulletList",
          icon: "i-lucide-list",
          label: "لیست نقطه‌ای",
        },
        {
          kind: "orderedList",
          icon: "i-lucide-list-ordered",
          label: "لیست شماره‌دار",
        },
      ],
    },
    {
      kind: "blockquote",
      icon: "i-lucide-text-quote",
      tooltip: { text: "نقل‌قول" },
    },
    {
      kind: "codeBlock",
      icon: "i-lucide-square-code",
      tooltip: { text: "بلاک کد" },
    },
    {
      kind: "horizontalRule",
      icon: "i-lucide-separator-horizontal",
      tooltip: { text: "خط جداکننده" },
    },
    {
      kind: "paragraph",
      icon: "i-lucide-align-left",
      tooltip: { text: "پاراگراف معمولی" },
    },
  ],
  [
    {
      kind: "mark",
      mark: "bold",
      icon: "i-lucide-bold",
      tooltip: { text: "ضخیم" },
    },
    {
      kind: "mark",
      mark: "italic",
      icon: "i-lucide-italic",
      tooltip: { text: "کج" },
    },
    {
      kind: "mark",
      mark: "underline",
      icon: "i-lucide-underline",
      tooltip: { text: "زیرخط‌دار" },
    },
    {
      kind: "mark",
      mark: "strike",
      icon: "i-lucide-strikethrough",
      tooltip: { text: "خط خورده" },
    },
    {
      kind: "mark",
      mark: "code",
      icon: "i-lucide-code",
      tooltip: { text: "کد" },
    },
  ],
  [
    { kind: "link", icon: "i-lucide-link", tooltip: { text: "لینک" } },
    { kind: "image", icon: "i-lucide-image", tooltip: { text: "تصویر" } },
    { kind: "emoji", icon: "i-lucide-smile", tooltip: { text: "ایموجی" } },
    {
      kind: "mention",
      icon: "i-lucide-at-sign",
      tooltip: { text: "منشن" },
    },
    {
      kind: "suggestion",
      icon: "i-lucide-slash",
      tooltip: { text: "پیشنهاد" },
    },
  ],
  [
    {
      icon: "i-lucide-align-justify",
      tooltip: { text: "Text Align" },
      content: {
        align: "end",
      },
      items: [
        {
          kind: "textAlign",
          align: "left",
          icon: "i-lucide-align-left",
          label: "چپ چین",
        },
        {
          kind: "textAlign",
          align: "center",
          icon: "i-lucide-align-center",
          label: "وسط چین",
        },
        {
          kind: "textAlign",
          align: "right",
          icon: "i-lucide-align-right",
          label: "راست چین",
        },
        {
          kind: "textAlign",
          align: "justify",
          icon: "i-lucide-align-justify",
          label: "تراز کردن",
        },
      ],
    },
  ],
  [
    {
      kind: "clearFormatting",
      icon: "i-lucide-x",
      tooltip: { text: "حذف فرمت‌ها" },
    },
    {
      kind: "duplicate",
      icon: "i-lucide-copy",
      tooltip: { text: "کپی" },
    },
    {
      kind: "delete",
      icon: "i-lucide-trash",
      tooltip: { text: "حذف" },
    },
    {
      kind: "moveUp",
      icon: "i-lucide-arrow-up",
      tooltip: { text: "انتقال به بالا" },
    },
    {
      kind: "moveDown",
      icon: "i-lucide-arrow-down",
      tooltip: { text: "انتقال به پایین" },
    },
  ],
];
</script>

<template>
  <div>
    <UEditor
      v-model="value"
      :extensions="extensions"
      content-type="html"
      class="min-h-48 prose"
      v-slot="{ editor }"
    >
      <div class="flex items-center gap-2 border-b border-gray-300 pb-2 mb-2 flex-wrap">
        <UEditorToolbar :editor="editor" :items="items" class="flex-wrap" />

        <UPopover>
          <UButton
            icon="i-lucide-table"
            size="sm"
            color="neutral"
            variant="outline"
          >
            جدول
          </UButton>

          <template #content>
            <div class="flex flex-col gap-2 p-3 min-w-48">
              <UButton
                icon="i-lucide-table"
                size="sm"
                color="neutral"
                variant="soft"
                @click="
                  editor.commands.insertTable({
                    rows: 3,
                    cols: 3,
                    withHeaderRow: true,
                  })
                "
              >
                اضافه کردن جدول
              </UButton>

              <UDivider />

              <UButton
                icon="i-lucide-plus"
                size="sm"
                color="neutral"
                variant="soft"
                @click="editor.commands.addRowAfter()"
              >
                اضافه کردن ردیف
              </UButton>

              <UDivider />

              <UButton
                icon="i-lucide-columns"
                size="sm"
                color="neutral"
                variant="soft"
                @click="editor.commands.addColumnAfter()"
              >
                اضافه کردن ستون
              </UButton>

              <UButton
                icon="i-lucide-minus"
                size="sm"
                color="error"
                variant="soft"
                @click="editor.commands.deleteRow()"
              >
                حذف ردیف
              </UButton>

              <UButton
                icon="i-lucide-minus"
                size="sm"
                color="error"
                variant="soft"
                @click="editor.commands.deleteColumn()"
              >
                حذف ستون
              </UButton>

              <UDivider />

              <UButton
                icon="i-lucide-trash"
                size="sm"
                color="error"
                variant="soft"
                @click="editor.commands.deleteTable()"
              >
                حذف کل جدول
              </UButton>
            </div>
          </template>
        </UPopover>
      </div>
      <UEditorDragHandle
        :editor="editor"
        :options="{ placement: 'right-start' }"
      />
    </UEditor>
  </div>
</template>

<style>
.prose table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #d1d5db;
}

.prose th {
  border: 1px solid #d1d5db;
  padding: 8px;
  background-color: #f3f4f6;
  text-align: right;
}

.prose td {
  border: 1px solid #d1d5db;
  padding: 8px;
}
</style>
