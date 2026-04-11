/** Time after send during which the author may edit a message */
const MESSAGE_EDIT_WINDOW_MS = 10 * 60 * 1000;

function isWithinEditWindow(createdAt) {
    if (!createdAt) return false;
    return Date.now() - new Date(createdAt).getTime() <= MESSAGE_EDIT_WINDOW_MS;
}

module.exports = {
    MESSAGE_EDIT_WINDOW_MS,
    isWithinEditWindow,
};
