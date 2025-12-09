/**
 * Ultra Rich Text Editor - Éditeur de texte avancé
 * Mode "Word-like" avec barre d'outils supérieure et support Recto/Verso
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link as LinkIcon,
  CheckSquare,
  Undo,
  Redo,
  Highlighter,
  Table as TableIcon,
  Palette,
  Maximize,
  Minimize,
  Sigma,
  Heading1,
  Heading2,
} from "lucide-react";
import DOMPurify from "dompurify";
import { LaTeXText } from "./LaTeXRenderer";

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  backValue?: string;
  onBackChange?: (content: string) => void;
  placeholder?: string;
  backPlaceholder?: string;
  className?: string;
  onImageUpload?: (file: File) => Promise<string>;
  height?: string;
}

const COLORS = [
  "#000000",
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
];
const HIGHLIGHTS = [
  "transparent",
  "#FEF3C7",
  "#D1FAE5",
  "#DBEAFE",
  "#F3E8FF",
  "#FCE7F3",
];
const FONTS = ["Arial", "Georgia", "Verdana", "Times New Roman", "Courier New"];
const SIZES = [
  { label: "Petit", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Grand", value: "5" },
  { label: "Très grand", value: "7" },
];

export const UltraRichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  backValue,
  onBackChange,
  placeholder = "Recto...",
  backPlaceholder = "Verso...",
  className = "",
  onImageUpload,
  height = "400px",
}) => {
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [showFloatingMenu, setShowFloatingMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Initialize content
  useEffect(() => {
    if (frontRef.current && value && !frontRef.current.innerHTML)
      frontRef.current.innerHTML = value;
  }, []);
  useEffect(() => {
    if (
      backRef.current &&
      backValue !== undefined &&
      !backRef.current.innerHTML
    )
      backRef.current.innerHTML = backValue;
  }, []);

  const handleChange = useCallback(
    (content: string, isBack: boolean) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        if (isBack && onBackChange) onBackChange(content);
        else if (!isBack && onChange) onChange(content);
      }, 300);
    },
    [onChange, onBackChange]
  );

  const checkActiveFormats = useCallback(() => {
    const formats = new Set<string>();
    if (document.queryCommandState("bold")) formats.add("bold");
    if (document.queryCommandState("italic")) formats.add("italic");
    if (document.queryCommandState("underline")) formats.add("underline");
    if (document.queryCommandState("strikeThrough"))
      formats.add("strikeThrough");
    if (document.queryCommandState("justifyLeft")) formats.add("justifyLeft");
    if (document.queryCommandState("justifyCenter"))
      formats.add("justifyCenter");
    if (document.queryCommandState("justifyRight")) formats.add("justifyRight");
    if (document.queryCommandState("insertUnorderedList"))
      formats.add("insertUnorderedList");
    if (document.queryCommandState("insertOrderedList"))
      formats.add("insertOrderedList");
    setActiveFormats(formats);
  }, []);

  const executeCommand = useCallback(
    (command: string, val?: string) => {
      const target = lastFocusedRef.current || frontRef.current;
      if (!target) return;
      target.focus();
      document.execCommand(command, false, val);
      const newContent = target.innerHTML;
      handleChange(newContent, target === backRef.current);
      checkActiveFormats();
      setShowColorPicker(false);
      setShowHighlightPicker(false);
      setShowFloatingMenu(null);
    },
    [handleChange, checkActiveFormats]
  );

  const insertTable = () => {
    const html = `<table style="width:100%; border-collapse: collapse; margin: 1em 0; border: 1px solid #ddd;"><tbody><tr><td style="border:1px solid #ddd; padding: 8px; background:#f9fafb;">En-tête 1</td><td style="border:1px solid #ddd; padding: 8px; background:#f9fafb;">En-tête 2</td></tr><tr><td style="border:1px solid #ddd; padding: 8px;">Cellule 1</td><td style="border:1px solid #ddd; padding: 8px;">Cellule 2</td></tr></tbody></table><p><br/></p>`;
    executeCommand("insertHTML", html);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    const html = e.clipboardData.getData("text/html");
    const clean = DOMPurify.sanitize(html || text, {
      USE_PROFILES: { html: true },
    });
    document.execCommand("insertHTML", false, clean);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const image = files.find((f) => f.type.startsWith("image/"));
    if (image && onImageUpload) {
      const url = await onImageUpload(image);
      document.execCommand(
        "insertHTML",
        false,
        `<img src="${url}" style="max-width:100%;border-radius:8px;margin:1em 0;" />`
      );
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    // Markdown Shortcuts
    if ((e.nativeEvent as InputEvent).data === " ") {
      const range = sel.getRangeAt(0);
      const node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        const content = node.textContent || "";
        // Simple regex checks for end of string to avoid replacing inside words
        if (content.endsWith("# ")) {
          document.execCommand("formatBlock", false, "h1");
          // Cleanup the # is tricky in contentEditable without range manipulation
          // Simplified: we assume the user just typed it.
          // Ideally we select the last 2 chars and delete.
        } else if (content.endsWith("- ")) {
          document.execCommand("insertUnorderedList");
        } else if (content.endsWith("1. ")) {
          document.execCommand("insertOrderedList");
        }
      }
    }

    // Slash Menu Trigger
    const text = sel.anchorNode?.textContent || "";
    if (text.endsWith("/")) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setShowSlashMenu({ x: rect.left, y: rect.bottom + 5 });
    } else if (showSlashMenu) {
      if (text.includes(" ")) setShowSlashMenu(null);
    }

    handleChange(target.innerHTML, target === backRef.current);
  };

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width > 0) {
        setShowFloatingMenu({
          x: rect.left + rect.width / 2 - 50,
          y: rect.top - 40,
        });
      }
    } else {
      setShowFloatingMenu(null);
    }
    checkActiveFormats();
  };

  const handleFocus = (isBack: boolean) => {
    lastFocusedRef.current = isBack ? backRef.current : frontRef.current;
    checkActiveFormats();
  };

  const ToolbarBtn = ({
    icon: Icon,
    command,
    value,
    active,
    label,
    onClick,
  }: any) => (
    <button
      className={`toolbar-btn ${active ? "active" : ""}`}
      onClick={(e) => {
        e.preventDefault();
        onClick ? onClick() : executeCommand(command, value);
      }}
      title={label}
      type="button"
    >
      <Icon size={18} />
    </button>
  );

  const Divider = () => <div className="toolbar-divider" />;

  return (
    <div
      className={`ultra-editor ${className} ${
        isFullScreen ? "fixed inset-0 z-50 bg-white h-screen" : ""
      }`}
    >
      {/* Top Toolbar */}
      <div className="editor-toolbar">
        <div className="toolbar-group">
          <ToolbarBtn icon={Undo} command="undo" label="Annuler" />
          <ToolbarBtn icon={Redo} command="redo" label="Rétablir" />
        </div>
        <Divider />
        <div className="toolbar-group">
          <select
            className="toolbar-select"
            onChange={(e) => executeCommand("formatBlock", e.target.value)}
          >
            <option value="p">Normal</option>
            <option value="h1">Titre 1</option>
            <option value="h2">Titre 2</option>
            <option value="h3">Titre 3</option>
            <option value="blockquote">Citation</option>
            <option value="pre">Code</option>
          </select>
          <select
            className="toolbar-select"
            onChange={(e) => executeCommand("fontName", e.target.value)}
          >
            <option value="">Police</option>
            {FONTS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <select
            className="toolbar-select w-20"
            onChange={(e) => executeCommand("fontSize", e.target.value)}
          >
            <option value="3">Taille</option>
            {SIZES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <Divider />
        <div className="toolbar-group">
          <ToolbarBtn
            icon={Bold}
            command="bold"
            active={activeFormats.has("bold")}
            label="Gras"
          />
          <ToolbarBtn
            icon={Italic}
            command="italic"
            active={activeFormats.has("italic")}
            label="Italique"
          />
          <ToolbarBtn
            icon={Underline}
            command="underline"
            active={activeFormats.has("underline")}
            label="Souligné"
          />
          <ToolbarBtn
            icon={Strikethrough}
            command="strikeThrough"
            active={activeFormats.has("strikeThrough")}
            label="Barré"
          />
          <div className="relative">
            <ToolbarBtn
              icon={Palette}
              onClick={() => setShowColorPicker(!showColorPicker)}
              label="Couleur texte"
            />
            {showColorPicker && (
              <div className="color-picker-popover">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    className="color-swatch"
                    style={{ background: c }}
                    onClick={() => executeCommand("foreColor", c)}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <ToolbarBtn
              icon={Highlighter}
              onClick={() => setShowHighlightPicker(!showHighlightPicker)}
              label="Surligner"
            />
            {showHighlightPicker && (
              <div className="color-picker-popover">
                {HIGHLIGHTS.map((c) => (
                  <button
                    key={c}
                    className="color-swatch"
                    style={{
                      background: c,
                      border: c === "transparent" ? "1px solid #ddd" : "none",
                    }}
                    onClick={() => executeCommand("hiliteColor", c)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <Divider />
        <div className="toolbar-group">
          <ToolbarBtn
            icon={AlignLeft}
            command="justifyLeft"
            active={activeFormats.has("justifyLeft")}
            label="Gauche"
          />
          <ToolbarBtn
            icon={AlignCenter}
            command="justifyCenter"
            active={activeFormats.has("justifyCenter")}
            label="Centrer"
          />
          <ToolbarBtn
            icon={AlignRight}
            command="justifyRight"
            active={activeFormats.has("justifyRight")}
            label="Droite"
          />
        </div>
        <Divider />
        <div className="toolbar-group">
          <ToolbarBtn
            icon={List}
            command="insertUnorderedList"
            active={activeFormats.has("insertUnorderedList")}
            label="Puces"
          />
          <ToolbarBtn
            icon={ListOrdered}
            command="insertOrderedList"
            active={activeFormats.has("insertOrderedList")}
            label="Numérotée"
          />
          <ToolbarBtn
            icon={CheckSquare}
            command="insertHTML"
            value='<input type="checkbox"> '
            label="Checkbox"
          />
        </div>
        <Divider />
        <div className="toolbar-group">
          <ToolbarBtn
            icon={LinkIcon}
            onClick={() => {
              const url = prompt("URL du lien:");
              if (url) executeCommand("createLink", url);
            }}
            label="Lien"
          />
          <ToolbarBtn
            icon={ImageIcon}
            onClick={() => fileInputRef.current?.click()}
            label="Image"
          />
          <ToolbarBtn icon={TableIcon} onClick={insertTable} label="Tableau" />
          <ToolbarBtn
            icon={Sigma}
            onClick={() => executeCommand("insertHTML", "$$ x^2 $$")}
            label="Math (LaTeX)"
          />
        </div>
        <div className="flex-1" />
        <div className="toolbar-group">
          <button
            className={`toolbar-btn ${previewMode ? "active" : ""}`}
            onClick={() => setPreviewMode(!previewMode)}
            title="Mode Aperçu"
          >
            {previewMode ? "Éditer" : "Aperçu"}
          </button>
          <ToolbarBtn
            icon={isFullScreen ? Minimize : Maximize}
            onClick={() => setIsFullScreen(!isFullScreen)}
            label="Plein écran"
          />
        </div>
      </div>

      {/* Editor Area(s) */}
      <div
        className="editor-container"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {previewMode ? (
          <div className="flex flex-col md:flex-row gap-4 p-6 bg-white w-full h-full overflow-auto">
            <div className="flex-1 border p-4 rounded">
              <h3 className="text-sm font-bold text-gray-500 mb-2">
                RECTO (Aperçu)
              </h3>
              <LaTeXText text={value} />
            </div>
            {backValue !== undefined && (
              <div className="flex-1 border p-4 rounded">
                <h3 className="text-sm font-bold text-gray-500 mb-2">
                  VERSO (Aperçu)
                </h3>
                <LaTeXText text={backValue} />
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="editor-pane">
              {backValue !== undefined && (
                <div className="pane-label">Recto</div>
              )}
              <div
                ref={frontRef}
                className="editor-content"
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onPaste={handlePaste}
                onFocus={() => handleFocus(false)}
                onMouseUp={handleMouseUp}
                onKeyUp={checkActiveFormats}
                data-placeholder={placeholder}
                style={{
                  minHeight: isFullScreen ? "calc(100vh - 60px)" : height,
                }}
              />
            </div>
            {backValue !== undefined && (
              <div className="editor-pane">
                <div className="pane-label">Verso</div>
                <div
                  ref={backRef}
                  className="editor-content"
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleInput}
                  onPaste={handlePaste}
                  onFocus={() => handleFocus(true)}
                  onMouseUp={handleMouseUp}
                  onKeyUp={checkActiveFormats}
                  data-placeholder={backPlaceholder}
                  style={{
                    minHeight: isFullScreen ? "calc(100vh - 60px)" : height,
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Menu */}
      {showFloatingMenu && !previewMode && (
        <div
          className="fixed bg-white shadow-xl border rounded-lg p-1 flex gap-1 z-50 animate-in fade-in zoom-in duration-200"
          style={{ left: showFloatingMenu.x, top: showFloatingMenu.y }}
        >
          <ToolbarBtn
            icon={Bold}
            command="bold"
            active={activeFormats.has("bold")}
          />
          <ToolbarBtn
            icon={Italic}
            command="italic"
            active={activeFormats.has("italic")}
          />
          <ToolbarBtn
            icon={Highlighter}
            command="hiliteColor"
            value="#FEF3C7"
          />
        </div>
      )}

      {/* Slash Menu */}
      {showSlashMenu && !previewMode && (
        <div
          className="fixed bg-white shadow-xl border rounded-lg p-1 w-48 z-50 flex flex-col gap-1"
          style={{ left: showSlashMenu.x, top: showSlashMenu.y }}
        >
          <div className="text-xs font-semibold text-gray-500 px-2 py-1">
            INSÉRER
          </div>
          <button
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded text-sm text-left"
            onClick={() => {
              executeCommand("formatBlock", "h1");
              setShowSlashMenu(null);
            }}
          >
            <Heading1 size={14} /> Titre 1
          </button>
          <button
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded text-sm text-left"
            onClick={() => {
              executeCommand("formatBlock", "h2");
              setShowSlashMenu(null);
            }}
          >
            <Heading2 size={14} /> Titre 2
          </button>
          <button
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded text-sm text-left"
            onClick={() => {
              executeCommand("insertUnorderedList");
              setShowSlashMenu(null);
            }}
          >
            <List size={14} /> Liste à puces
          </button>
          <button
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded text-sm text-left"
            onClick={() => {
              executeCommand("insertOrderedList");
              setShowSlashMenu(null);
            }}
          >
            <ListOrdered size={14} /> Liste numérotée
          </button>
          <button
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded text-sm text-left"
            onClick={() => {
              insertTable();
              setShowSlashMenu(null);
            }}
          >
            <TableIcon size={14} /> Tableau
          </button>
          <button
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded text-sm text-left"
            onClick={() => {
              fileInputRef.current?.click();
              setShowSlashMenu(null);
            }}
          >
            <ImageIcon size={14} /> Image
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file && onImageUpload) {
            const url = await onImageUpload(file);
            executeCommand(
              "insertHTML",
              `<img src="${url}" style="max-width:100%;border-radius:8px;margin:1em 0;" />`
            );
          }
        }}
      />

      <style>{`
        .ultra-editor { display: flex; flex-direction: column; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .editor-toolbar { background: #fff; border-bottom: 1px solid #e5e7eb; padding: 8px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; position: sticky; top: 0; z-index: 10; }
        .toolbar-group { display: flex; align-items: center; gap: 2px; }
        .toolbar-divider { width: 1px; height: 24px; background: #e5e7eb; margin: 0 4px; }
        .toolbar-btn { padding: 6px; border-radius: 4px; border: none; background: transparent; color: #4b5563; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .toolbar-btn:hover { background: #f3f4f6; color: #111827; }
        .toolbar-btn.active { background: #e0e7ff; color: #4f46e5; }
        .toolbar-select { border: 1px solid #e5e7eb; border-radius: 4px; padding: 4px; font-size: 13px; color: #374151; outline: none; cursor: pointer; }
        .toolbar-select:hover { border-color: #d1d5db; }
        .color-picker-popover { position: absolute; top: 100%; left: 0; background: #fff; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); padding: 8px; border-radius: 6px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; z-index: 20; margin-top: 4px; }
        .color-swatch { width: 20px; height: 20px; border-radius: 3px; border: none; cursor: pointer; }
        .color-swatch:hover { transform: scale(1.1); }
        .editor-container { display: flex; flex-direction: row; gap: 2px; background: #e5e7eb; min-height: 400px; }
        .editor-pane { flex: 1; background: #fff; display: flex; flex-direction: column; position: relative; }
        .pane-label { background: #f9fafb; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 12px; border-bottom: 1px solid #f3f4f6; font-weight: 600; }
        .editor-content { flex: 1; padding: 24px; outline: none; overflow-y: auto; font-size: 16px; line-height: 1.6; color: #1f2937; }
        .editor-content[data-placeholder]:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }
        .editor-content h1 { font-size: 2em; font-weight: 800; margin: 0.67em 0; line-height: 1.2; }
        .editor-content h2 { font-size: 1.5em; font-weight: 700; margin: 0.75em 0; line-height: 1.3; }
        .editor-content h3 { font-size: 1.17em; font-weight: 600; margin: 0.83em 0; line-height: 1.4; }
        .editor-content p { margin-bottom: 1em; line-height: 1.6; }
        .editor-content blockquote { border-left: 4px solid #e5e7eb; padding-left: 1em; color: #6b7280; font-style: italic; margin: 1em 0; }
        .editor-content pre { background: #f3f4f6; padding: 1em; border-radius: 6px; font-family: monospace; overflow-x: auto; margin: 1em 0; }
        .editor-content b, .editor-content strong { font-weight: 700; }
        .editor-content i, .editor-content em { font-style: italic; }
        .editor-content u { text-decoration: underline; }
        .editor-content s, .editor-content strike, .editor-content del { text-decoration: line-through; }
        .editor-content a { color: #2563eb; text-decoration: underline; cursor: pointer; }
        .editor-content a:hover { color: #1d4ed8; }
        .editor-content code { background: #f3f4f6; padding: 0.2em 0.4em; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
        .editor-content ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
        .editor-content ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; }
        .editor-content li { margin-bottom: 0.25em; }
        .editor-content img { max-width: 100%; height: auto; display: inline-block; border-radius: 4px; }
        .editor-content table { width: 100%; border-collapse: collapse; margin-bottom: 1em; }
        .editor-content td, .editor-content th { border: 1px solid #d1d5db; padding: 8px; vertical-align: top; }
        .editor-content th { background-color: #f9fafb; font-weight: 600; text-align: left; }
        @media (max-width: 600px) { .editor-container { flex-direction: column; } .editor-pane { min-height: 200px; } }
      `}</style>
    </div>
  );
};

export default UltraRichTextEditor;
