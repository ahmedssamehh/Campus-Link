/** Time after send during which the author may edit a message */
const MESSAGE_EDIT_WINDOW_MS = 10 * 60 * 1000;

function isWithinEditWindow(createdAt) {
    if (!createdAt) return false;
    return Date.now() - new Date(createdAt).getTime() <= MESSAGE_EDIT_WINDOW_MS;
}

/** Only plain text messages may be edited (not files, images, or system messages). */
function isTextMessageEditable(message) {
    if (!message) return false;
    const type = message.type || 'text';
    if (type !== 'text') return false;
    if (message.attachments && message.attachments.length > 0) return false;
    return true;
}

module.exports = {
    MESSAGE_EDIT_WINDOW_MS,
    isWithinEditWindow,
    isTextMessageEditable,
};