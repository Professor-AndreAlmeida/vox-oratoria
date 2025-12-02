
// A simple converter to handle basic markdown for the PulpitMode component.

/**
 * Converts a simple markdown string (newlines, bold, italic, lists) to HTML.
 * This is used to set the initial content of the contentEditable div.
 * @param markdown The markdown string.
 * @returns An HTML string with <br> for newlines and tags for formatting.
 */
export const convertMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  
  // 1. Escape basic HTML to prevent injection
  let html = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  // 2. Parse Bold (**text**)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // 3. Parse Italic (*text*)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // 4. Parse Lists ( - Item) -> Replace with bullet entity for visual clarity
  html = html.replace(/^\s*-\s+(.*$)/gm, '&bull; $1');

  // 5. Replace newlines with <br />
  return html.replace(/\n/g, '<br />');
};


/**
 * Converts HTML from a contentEditable div back to a plain text/markdown string.
 * Attempts to preserve bold/italic formatting back to markdown syntax.
 * @param html The innerHTML string from the element.
 * @returns A plain text string with \n for line breaks and ** for bold.
 */
export const convertHtmlToMarkdown = (html: string): string => {
    if (!html) return '';
    
    // Pre-process HTML to restore markdown syntax from tags BEFORE creating the temp div.
    // This ensures we capture the formatting even if innerText would strip tags.
    let processedHtml = html
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<div>/gi, '\n') // div often implies newline in contentEditable
        .replace(/<\/div>/gi, '')
        .replace(/<p>/gi, '')
        .replace(/<\/p>/gi, '\n');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = processedHtml;

    // innerText handles decoding entities and stripping any remaining unknown tags
    let markdown = tempDiv.innerText || '';

    // Decode entities that might be double encoded
    markdown = markdown
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&nbsp;/g, " ");

    // Fix potential double escaping or spacing issues
    return markdown.trim();
};
