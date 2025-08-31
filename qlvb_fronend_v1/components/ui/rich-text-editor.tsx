"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter,
  List,
  ListOrdered,
  Undo,
  Redo,
  Type,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { forwardRef, useImperativeHandle } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface RichTextEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  minHeight?: string;
}

interface RichTextEditorRef {
  getHTML: () => string;
  getText: () => string;
  setContent: (content: string) => void;
  focus: () => void;
  clear: () => void;
}

const colorPresets = [
  "#000000",
  "#333333",
  "#666666",
  "#999999",
  "#CCCCCC",
  "#FF0000",
  "#FF6600",
  "#FFCC00",
  "#00FF00",
  "#0066FF",
  "#6600FF",
  "#FF0066",
  "#FF3366",
  "#66FF33",
  "#33CCFF",
];

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  (
    {
      content = "",
      onChange,
      placeholder = "Nhập nội dung...",
      className,
      editable = true,
      minHeight = "120px",
    },
    ref
  ) => {
    const editor = useEditor({
      extensions: [
        StarterKit,
        Highlight.configure({ multicolor: true }),
        Underline,
        TextStyle,
        Color,
      ],
      content,
      editable,
      immediatelyRender: false, // Fix SSR hydration mismatch
      onUpdate: ({ editor }) => {
        onChange?.(editor.getHTML());
      },
      editorProps: {
        attributes: {
          class: cn(
            "prose prose-sm max-w-none focus:outline-none",
            "min-h-[120px] px-3 py-2 text-sm",
            className
          ),
          style: `min-height: ${minHeight}`,
          "data-placeholder": placeholder,
        },
      },
    });

    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() || "",
      getText: () => editor?.getText() || "",
      setContent: (content: string) => editor?.commands.setContent(content),
      focus: () => editor?.commands.focus(),
      clear: () => editor?.commands.clearContent(),
    }));

    if (!editor) {
      return null;
    }

    const ToolbarButton = ({
      onClick,
      isActive = false,
      disabled = false,
      children,
      title,
    }: {
      onClick: () => void;
      isActive?: boolean;
      disabled?: boolean;
      children: React.ReactNode;
      title?: string;
    }) => (
      <Button
        type="button"
        variant={isActive ? "default" : "ghost"}
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "h-8 w-8 p-0",
          isActive && "bg-primary text-primary-foreground"
        )}
        title={title}
      >
        {children}
      </Button>
    );

    return (
      <div
        className={cn(
          "border rounded-md focus-within:ring-1 focus-within:ring-primary",
          className
        )}
      >
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
          {/* Text formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Đậm (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Nghiêng (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="Gạch chân (Ctrl+U)"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            isActive={editor.isActive("highlight")}
            title="Tô sáng"
          >
            <Highlighter className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-6" />

          {/* Text color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Màu chữ"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="grid grid-cols-5 gap-2">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => editor.chain().focus().setColor(color).run()}
                    title={color}
                  />
                ))}
              </div>
              <Separator className="my-2" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => editor.chain().focus().unsetColor().run()}
              >
                Xóa màu
              </Button>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-6" />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Danh sách dấu đầu dòng"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Danh sách số thứ tự"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-6" />

          {/* Undo/Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Hoàn tác (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Làm lại (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-6" />

          {/* Clear formatting */}
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().clearNodes().unsetAllMarks().run()
            }
            title="Xóa định dạng"
          >
            <Type className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Editor content */}
        <EditorContent
          editor={editor}
          className={cn(
            "prose prose-sm max-w-none",
            "[&_.ProseMirror]:outline-none [&_.ProseMirror]:border-none",
            "[&_.ProseMirror]:min-h-[120px] [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-2",
            "[&_.ProseMirror]:text-sm [&_.ProseMirror]:leading-relaxed",
            "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
            "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground",
            "[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left",
            "[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none",
            "[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
          )}
        />
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

export { RichTextEditor, type RichTextEditorRef };
export default RichTextEditor;
