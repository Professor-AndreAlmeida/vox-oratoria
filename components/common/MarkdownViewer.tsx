import React from 'react';

// NOTE: This is a very basic markdown-to-HTML converter.
// For a real-world application, a library like 'marked' or 'react-markdown' would be used for security and feature richness.
const simpleMarkdownToHtml = (markdown: string) => {
    if (!markdown) return '';
    
    // Escape basic HTML characters to prevent XSS from unexpected AI output
    let safeHtml = markdown
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Process markdown features
    safeHtml = safeHtml
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Headers (h3 for this context)
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        // Unordered list items
        .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
        // Collapse multiple <ul> tags
        .replace(/<\/ul>\s?<ul>/g, '')
        // Newlines to <br>
        .replace(/\n/g, '<br />');

    return safeHtml;
};


interface MarkdownViewerProps {
    markdown: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ markdown }) => {
    const htmlContent = simpleMarkdownToHtml(markdown);

    return (
        <div 
            className="prose prose-invert prose-sm sm:prose-base max-w-none p-4"
            dangerouslySetInnerHTML={{ __html: htmlContent }} 
        />
    );
};

export default MarkdownViewer;
