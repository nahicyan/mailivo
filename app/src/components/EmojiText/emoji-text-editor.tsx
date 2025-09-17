// app/src/components/RichText/rich-text-editor.tsx
'use client';

import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

export interface EmojiTextEditorRef {
  clear: () => void;
  focus: () => void;
  getContent: () => string;
  setContent: (content: string) => void;
  insertAtCursor: (text: string) => void;
}

interface EmojiTextEditorProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
  className?: string;
  showEmojiPicker?: boolean;
}

export const EmojiTextEditor = forwardRef<EmojiTextEditorRef, EmojiTextEditorProps>(({
  value,
  onChange,
  placeholder = 'Type your message...',
  disabled = false,
  maxLength,
  autoFocus = false,
  className,
  showEmojiPicker = true
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [charCount, setCharCount] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const lastValueRef = useRef(value);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const savedSelectionRef = useRef<{
    startContainer: Node;
    startOffset: number;
    endContainer: Node;
    endOffset: number;
  } | null>(null);

  // Save cursor position when emoji picker opens/closes
  const handleEmojiPickerOpenChange = (open: boolean) => {
    if (open) {
      saveSelection();
    }
    setIsEmojiPickerOpen(open);
  };

  // Handle emoji selection
  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    if (editorRef.current && !disabled) {
      // Restore saved selection
      restoreSelection();
      
      // Insert emoji at cursor
      const emoji = emojiData.emoji;
      insertTextAtCursor(emoji);
      
      // Close emoji picker
      setIsEmojiPickerOpen(false);
      
      // Focus back on editor
      editorRef.current.focus();
    }
  };

  const insertTextAtCursor = (text: string) => {
    if (editorRef.current && !disabled) {
      const selection = window.getSelection();
      
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Delete any selected content
        range.deleteContents();
        
        // Create and insert the text node
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        
        // Move cursor after the inserted text
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        range.collapse(true);
        
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // Fallback: insert at end
        const textNode = document.createTextNode(text);
        editorRef.current.appendChild(textNode);
        
        // Set cursor at end
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      
      handleInput();
    }
  };

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    clear: () => {
      if (editorRef.current) {
        editorRef.current.textContent = '';
        setCharCount(0);
        lastValueRef.current = '';
        onChange?.('');
      }
    },
    focus: () => {
      editorRef.current?.focus();
    },
    getContent: () => {
      return editorRef.current?.textContent || '';
    },
    setContent: (content: string) => {
      if (editorRef.current) {
        editorRef.current.textContent = content;
        updateCharCount();
        lastValueRef.current = content;
        onChange?.(content);
      }
    },
    insertAtCursor: (text: string) => {
      if (editorRef.current && !disabled) {
        // Focus the editor first
        editorRef.current.focus();
        
        // Restore saved selection if available
        if (savedSelectionRef.current) {
          restoreSelection();
        }
        
        insertTextAtCursor(text);
      }
    }
  }));

  // Only update content when value prop changes from external source
  useEffect(() => {
    if (editorRef.current && value !== lastValueRef.current) {
      // Only update if we're not focused (external change) or if content is empty
      if (!isFocused || editorRef.current.textContent === '') {
        editorRef.current.textContent = value;
        updateCharCount();
      }
      lastValueRef.current = value;
    }
  }, [value, isFocused]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
    }
  }, [autoFocus]);

  const updateCharCount = () => {
    if (editorRef.current) {
      const text = editorRef.current.textContent || '';
      setCharCount(text.length);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.textContent || '';
      const textLength = content.length;
      
      if (maxLength && textLength > maxLength) {
        // Truncate to max length
        editorRef.current.textContent = content.substring(0, maxLength);
        return;
      }
      
      setCharCount(textLength);
      lastValueRef.current = content;
      onChange?.(content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (maxLength && charCount >= maxLength && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
  };

  // Save cursor position
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      savedSelectionRef.current = {
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset
      };
    } else {
      // If no selection, save cursor at end
      if (editorRef.current) {
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        savedSelectionRef.current = {
          startContainer: range.startContainer,
          startOffset: range.startOffset,
          endContainer: range.endContainer,
          endOffset: range.endOffset
        };
      }
    }
  };

  // Restore saved selection
  const restoreSelection = () => {
    if (savedSelectionRef.current && editorRef.current) {
      const selection = window.getSelection();
      const range = document.createRange();
      
      try {
        // Check if the saved nodes are still in the DOM
        if (savedSelectionRef.current.startContainer && 
            editorRef.current.contains(savedSelectionRef.current.startContainer)) {
          range.setStart(
            savedSelectionRef.current.startContainer,
            savedSelectionRef.current.startOffset
          );
          range.setEnd(
            savedSelectionRef.current.endContainer || savedSelectionRef.current.startContainer,
            savedSelectionRef.current.endOffset
          );
        } else {
          // Fallback to end of content
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
        }
        
        selection?.removeAllRanges();
        selection?.addRange(range);
      } catch (e) {
        // If restoration fails, position at end
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  };

  return (
    <div className={cn('border rounded-md', className)}>
      {/* Simple Toolbar - Only Emoji */}
      {showEmojiPicker && (
        <div className="flex items-center gap-1 p-2 border-b">
          <Popover open={isEmojiPickerOpen} onOpenChange={handleEmojiPickerOpenChange}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={disabled}
                title="Add emoji"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <EmojiPicker
                onEmojiClick={handleEmojiSelect}
                autoFocusSearch={false}
                height={400}
                width={350}
                searchPlaceHolder="Search emojis..."
                previewConfig={{
                  showPreview: false
                }}
              />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground ml-2">Plain text with emoji support</span>
        </div>
      )}

      {/* Plain Text Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          'min-h-[120px] p-3 text-base outline-none',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          disabled && 'cursor-not-allowed opacity-50',
          'whitespace-pre-wrap'
        )}
        style={{
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />

      {/* Character Counter */}
      {maxLength && (
        <div className="flex justify-end px-3 py-2 text-xs text-muted-foreground border-t">
          <span className={cn(
            charCount > maxLength * 0.9 && 'text-orange-600',
            charCount >= maxLength && 'text-red-600'
          )}>
            {charCount}/{maxLength}
          </span>
        </div>
      )}

      {/* Empty state placeholder */}
      <style jsx>{`
        [contenteditable=true]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
});

EmojiTextEditor.displayName = 'EmojiTextEditor';