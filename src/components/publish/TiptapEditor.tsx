"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const buttons = [
    { icon: "format_bold", action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
    { icon: "format_italic", action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
    { icon: "format_list_bulleted", action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
    { icon: "format_list_numbered", action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
    { icon: "format_quote", action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote") },
    { icon: "undo", action: () => editor.chain().focus().undo().run(), active: false },
    { icon: "redo", action: () => editor.chain().focus().redo().run(), active: false },
  ];

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-surface-container-high/50 backdrop-blur-md border-b border-white/20 rounded-t-2xl">
      {buttons.map((btn, idx) => (
        <button
          key={idx}
          type="button"
          onClick={btn.action}
          className={`p-2 rounded-lg hover:bg-white/20 transition-colors ${
            btn.active ? "text-primary bg-primary/10" : "text-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">{btn.icon}</span>
        </button>
      ))}
    </div>
  );
};

export default function TiptapEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base !max-w-none focus:outline-none p-6 min-h-[400px] text-on-surface",
      },
    },
  });

  return (
    <div className="glass-panel border border-white/30 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-white/20">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
