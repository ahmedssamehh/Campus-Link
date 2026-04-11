const API_BASE =
    (process.env.REACT_APP_API_URL || '').replace(/\/api\/?$/, '') ||
    process.env.REACT_APP_SOCKET_URL ||
    '';

export function getMediaUrl(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
        return path;
    }
    if (!API_BASE) return path;
    return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}
