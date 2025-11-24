function buildListPath(page, searchTerm = '') {
    const trimmed = searchTerm ? searchTerm : '';
    if (page <= 1) {
        if (!trimmed) {
            return '/';
        }
        return `/?q=${encodeURIComponent(trimmed)}`;
    }
    const base = `/?page=${page}`;
    if (!trimmed) {
        return base;
    }
    return `${base}&q=${encodeURIComponent(trimmed)}`;
}

module.exports = { buildListPath };
