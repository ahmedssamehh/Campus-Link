/**
 * Short label for chat list preview (not raw filenames).
 * @param {object} msg - Message with optional content, text, attachments[], type
 * @returns {string}
 */
export function formatMessageListPreview(msg) {
  if (!msg) return '';

  const attachments = msg.attachments || [];
  const type = msg.type || 'text';
  const content = (msg.content || msg.text || '').trim();

  if (attachments.length > 0) {
    const labels = attachments.map(labelForAttachment);
    const unique = [...new Set(labels)];
    if (unique.length === 1) {
      return attachments.length > 1 ? `${unique[0]}s` : unique[0];
    }
    return `${attachments.length} attachments`;
  }

  if (type === 'file' && !attachments.length) {
    return 'Attachment';
  }

  return content || 'Message';
}

function labelForAttachment(att) {
  const m = (att.mimetype || att.type || '').toLowerCase();
  const name = (att.filename || att.originalname || '').toLowerCase();

  if (m.startsWith('image/')) return 'Photo';
  if (m.startsWith('video/')) return 'Video';
  if (m.startsWith('audio/')) return 'Audio';
  if (m.includes('pdf') || name.endsWith('.pdf')) return 'PDF';
  if (
    m.includes('word') ||
    m.includes('document') ||
    name.endsWith('.doc') ||
    name.endsWith('.docx')
  ) {
    return 'Document';
  }
  if (m.includes('sheet') || name.endsWith('.xls') || name.endsWith('.xlsx')) {
    return 'Spreadsheet';
  }
  if (m.includes('presentation') || name.endsWith('.ppt') || name.endsWith('.pptx')) {
    return 'Presentation';
  }
  if (m.includes('zip') || name.endsWith('.zip') || name.endsWith('.rar')) {
    return 'Archive';
  }
  return 'File';
}
