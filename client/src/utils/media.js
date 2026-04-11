let _cachedBase = null;

function getApiBase() {
    if (_cachedBase !== null) return _cachedBase;

    const apiUrl = (process.env.REACT_APP_API_URL || '').replace(/\/api\/?$/, '');
    const socketUrl = process.env.REACT_APP_SOCKET_URL || '';

    _cachedBase = apiUrl || socketUrl || '';
    return _cachedBase;
}

export function getMediaUrl(path) {
    if (!path) return '';
    if (
        path.startsWith('http://') ||
        path.startsWith('https://') ||
        path.startsWith('blob:') ||
        path.startsWith('data:')
    ) {
        return path;
    }

    const base = getApiBase();
    if (!base) return path;
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}
