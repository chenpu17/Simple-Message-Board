function buildSearchClause(input = '') {
    const term = input.trim();
    if (!term) {
        return { clause: '', params: [], term: '' };
    }
    const escaped = term.replace(/([%_\\])/g, '\\$1');
    return {
        clause: "WHERE content LIKE ? ESCAPE '\\\\'",
        params: [`%${escaped}%`],
        term
    };
}

module.exports = { buildSearchClause };
