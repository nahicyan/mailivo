// app/src/lib/utils/text-converter.ts

/**
 * Converts rich text HTML to plain text while preserving emojis
 * This is specifically for Landivo property titles that may contain:
 * - HTML formatting tags (<p>, <strong>, <em>, etc.)
 * - Emojis (which we want to keep)
 * - &nbsp; and other HTML entities
 */
export function richTextToPlainText(html: string): string {
  if (!html) return '';
  
  // Create a temporary DOM element to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Get text content (this automatically handles HTML entities and preserves emojis)
  let text = temp.textContent || temp.innerText || '';
  
  // Clean up excessive whitespace but preserve single spaces
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

/**
 * Server-side version (for Node.js/API routes) without DOM
 */
export function richTextToPlainTextServer(html: string): string {
  if (!html) return '';
  
  // Remove HTML tags while preserving content
  let text = html
    .replace(/<br\s*\/?>/gi, ' ')  // Replace <br> with space
    .replace(/<\/p>/gi, ' ')        // Replace closing p tags with space
    .replace(/<[^>]+>/g, '')        // Remove all other HTML tags
    .replace(/&nbsp;/g, ' ')        // Replace &nbsp; with space
    .replace(/&amp;/g, '&')         // Convert &amp; to &
    .replace(/&lt;/g, '<')          // Convert &lt; to 
    .replace(/&gt;/g, '>')          // Convert &gt; to >
    .replace(/&quot;/g, '"')        // Convert &quot; to "
    .replace(/&#39;/g, "'")         // Convert &#39; to '
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .trim();
  
  return text;
}