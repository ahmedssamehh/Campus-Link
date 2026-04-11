const API_BASE = process.env.REACT_APP_API_URL?.replace(/\/api\/?$/, '') || '';

export function getMediaUrl(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
        return path;
    }
    return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}
