function buildListPath(page, searchTerm = '', tagFilter = '') {
    const trimmedSearch = searchTerm ? searchTerm : '';
    const trimmedTag = tagFilter ? tagFilter : '';

    // 构建查询参数
    const params = [];

    if (page > 1) {
        params.push(`page=${page}`);
    }

    if (trimmedSearch) {
        params.push(`q=${encodeURIComponent(trimmedSearch)}`);
    }

    if (trimmedTag) {
        params.push(`tag=${encodeURIComponent(trimmedTag)}`);
    }

    if (params.length === 0) {
        return '/';
    }

    return '/?' + params.join('&');
}

module.exports = { buildListPath };
