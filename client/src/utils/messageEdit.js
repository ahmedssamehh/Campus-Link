/** Must match server `MESSAGE_EDIT_WINDOW_MS` */
export const MESSAGE_EDIT_WINDOW_MS = 10 * 60 * 1000;

export function isWithinEditWindow(createdAt) {
    if (!createdAt) return false;
    return Date.now() - new Date(createdAt).getTime() <= MESSAGE_EDIT_WINDOW_MS;
}

/** Matches server: only plain text messages (no files/system) may be edited. */
export function isTextMessageEditable(message) {
    if (!message) return false;
    const type = message.type || 'text';
    if (type !== 'text') return false;
    if (message.attachments && message.attachments.length > 0) return false;
    return true;
}