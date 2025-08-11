'use client';

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { 
  Bold, 
  Italic, 
  Underline, 
  Smile, 
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

// Dynamic import for emoji picker to avoid SSR issues
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(
  () => import('emoji-picker-react'),
  { 
    ssr: false,
    loading: () => <div className="w-80 h-64 flex items-center justify-center text-sm text-muted-foreground">Loading emojis...</div>
  }
);

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  disabled?: boolean;
  showToolbar?: boolean;
  showEmojiPicker?: boolean;
  autoFocus?: boolean;
}

export interface RichTextEditorRef {
  clear: () => void;
  focus: () => void;
  getContent: () => string;
  setContent: (content: string) => void;
  insertAtCursor: (text: string) => void;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({
  value = '',
  onChange,
  placeholder = 'Start typing...',
  className,
  maxLength = 500,
  disabled = false,
  showToolbar = true,
  showEmojiPicker = true,
  autoFocus = false
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const lastValueRef = useRef(value);
  
  // Store cursor position before emoji picker opens
  const savedSelectionRef = useRef<{
    startContainer: Node | null;
    startOffset: number;
    endContainer: Node | null;
    endOffset: number;
  } | null>(null);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    clear: () => {
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
        setCharCount(0);
        lastValueRef.current = '';
        onChange?.('');
      }
    },
    focus: () => {
      editorRef.current?.focus();
    },
    getContent: () => {
      return editorRef.current?.innerHTML || '';
    },
    setContent: (content: string) => {
      if (editorRef.current) {
        editorRef.current.innerHTML = content;
        updateCharCount();
        lastValueRef.current = content;
        onChange?.(content);
      }
    },
    insertAtCursor: (text: string) => {
      if (editorRef.current && !disabled) {
        // Focus the editor first
        editorRef.current.focus();
        
        // Restore saved selection if available, otherwise get current selection
        if (savedSelectionRef.current) {
          restoreSelection();
        }
        
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
          
          if (editorRef.current.lastChild) {
            editorRef.current.appendChild(textNode);
          } else {
            editorRef.current.appendChild(textNode);
          }
          
          // Set cursor at end
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
        
        handleInput();
      }
    }
  }));

  // Only update content when value prop changes from external source
  useEffect(() => {
    if (editorRef.current && value !== lastValueRef.current) {
      // Only update if we're not focused (external change) or if content is empty
      if (!isFocused || editorRef.current.innerHTML === '') {
        editorRef.current.innerHTML = value;
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
      const content = editorRef.current.innerHTML;
      const textLength = (editorRef.current.textContent || '').length;
      
      if (maxLength && textLength > maxLength) {
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

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  // Save cursor position when emoji picker is about to open
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
        // If restoration fails, place cursor at end
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  };

  const handleEmojiSelect = (emojiData: any) => {
    if (editorRef.current && !disabled) {
      const emoji = emojiData.emoji || emojiData.native || emojiData;
      
      // Focus the editor first
      editorRef.current.focus();
      
      // Restore the saved selection
      restoreSelection();
      
      const selection = window.getSelection();
      
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Delete any selected content
        range.deleteContents();
        
        // Create and insert the emoji text node
        const textNode = document.createTextNode(emoji);
        range.insertNode(textNode);
        
        // Move cursor after the inserted emoji
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        range.collapse(true);
        
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // Fallback: insert at cursor position or end
        const textNode = document.createTextNode(emoji);
        const range = document.createRange();
        
        if (editorRef.current.lastChild) {
          range.setStartAfter(editorRef.current.lastChild);
          range.setEndAfter(editorRef.current.lastChild);
        } else {
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
        }
        
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      
      handleInput();
      setIsEmojiPickerOpen(false);
      
      // Clear saved selection after use
      savedSelectionRef.current = null;
    }
  };

  // Handle emoji picker open/close
  const handleEmojiPickerOpenChange = (open: boolean) => {
    if (open) {
      // Save current selection before opening
      saveSelection();
    }
    setIsEmojiPickerOpen(open);
  };

  const isCommandActive = (command: string): boolean => {
    return document.queryCommandState(command);
  };

  // Save selection on any selection change while editor is focused
  useEffect(() => {
    const handleSelectionChange = () => {
      if (isFocused && !isEmojiPickerOpen && editorRef.current?.contains(document.activeElement)) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          // Only save if the selection is within our editor
          if (editorRef.current?.contains(range.commonAncestorContainer)) {
            savedSelectionRef.current = {
              startContainer: range.startContainer,
              startOffset: range.startOffset,
              endContainer: range.endContainer,
              endOffset: range.endOffset
            };
          }
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [isFocused, isEmojiPickerOpen]);

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {showToolbar && (
        <div className="flex items-center gap-1 p-2 border-b bg-gray-50">
          {/* Text Formatting */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('bold')}
            className={cn('h-8 w-8 p-0', isCommandActive('bold') && 'bg-gray-200')}
            disabled={disabled}
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('italic')}
            className={cn('h-8 w-8 p-0', isCommandActive('italic') && 'bg-gray-200')}
            disabled={disabled}
          >
            <Italic className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('underline')}
            className={cn('h-8 w-8 p-0', isCommandActive('underline') && 'bg-gray-200')}
            disabled={disabled}
          >
            <Underline className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-gray-300 mx-1" />

          {/* Text Alignment */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('justifyLeft')}
            className="h-8 w-8 p-0"
            disabled={disabled}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('justifyCenter')}
            className="h-8 w-8 p-0"
            disabled={disabled}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand('justifyRight')}
            className="h-8 w-8 p-0"
            disabled={disabled}
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          {showEmojiPicker && (
            <>
              <div className="h-6 w-px bg-gray-300 mx-1" />
              
              {/* Emoji Picker */}
              <Popover open={isEmojiPickerOpen} onOpenChange={handleEmojiPickerOpenChange}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={disabled}
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
            </>
          )}
        </div>
      )}

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
          'prose prose-sm max-w-none',
          '[&_strong]:font-bold [&_em]:italic [&_u]:underline'
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
        <div className="flex justify-between items-center px-3 py-2 text-xs text-muted-foreground border-t">
          <span>Rich text with emoji support</span>
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

RichTextEditor.displayName = 'RichTextEditor';