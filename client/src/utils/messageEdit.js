/** Must match server `MESSAGE_EDIT_WINDOW_MS` */
export const MESSAGE_EDIT_WINDOW_MS = 10 * 60 * 1000;

export function isWithinEditWindow(createdAt) {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() <= MESSAGE_EDIT_WINDOW_MS;
}
