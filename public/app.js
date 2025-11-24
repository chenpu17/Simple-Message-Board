const LANGUAGE_KEY = 'lang';
let currentLanguage = 'zh';
const HTML_PARAM_KEYS = new Set(['term']);

const LANGUAGE_OPTIONS = {
    zh: { label: '中文', locale: 'zh-CN' },
    en: { label: 'English', locale: 'en' }
};

const translations = {
    zh: {
        headerTitle: '简易留言板',
        headerSubtitle: function ({ max }) { return '支持 Markdown 留言，按 Ctrl + Enter 快速提交。最多保留 ' + max + ' 条。'; },
        statsTotal: function ({ total }) { return '共 ' + total + ' 条留言'; },
        statsMatches: function ({ total }) { return '共 ' + total + ' 条匹配'; },
        submitButton: '提交留言',
        toolbarHeading1: 'H1',
        toolbarHeading2: 'H2',
        toolbarBold: 'B',
        toolbarItalic: 'I',
        toolbarListUl: '• 列表',
        toolbarListOl: '1. 列表',
        toolbarInlineCode: '内联代码',
        toolbarCodeBlock: '代码块',
        toolbarQuote: '引用',
        toolbarLink: '链接',
        textareaPlaceholder: '试试使用 **Markdown** 语法，支持代码块、列表等格式。',
        tagsPlaceholder: '添加标签（用逗号或空格分隔）',
        searchTitle: '搜索留言',
        searchSubtitle: '支持模糊匹配并保留分页',
        searchButton: '搜索',
        searchClear: '清除',
        searchPlaceholder: '输入关键字',
        searchFilter: function ({ term }) { return '已筛选：' + term; },
        languageZh: '中文',
        languageEn: 'English',
        themeLight: '亮色',
        themeDark: '暗色',
        paginationLabel: function ({ current, totalpages }) { return '第 ' + current + ' / ' + totalpages + ' 页'; },
        paginationPrev: '上一页',
        paginationNext: '下一页',
        emptyDefault: '还没有留言，快来留下第一条消息吧～',
        emptySearch: function ({ term }) { return '没有找到包含 "' + term + '" 的留言。'; },
        copyButton: '复制',
        copySuccess: '已复制',
        copyFailure: '复制失败',
        deleteButton: '删除',
        codeFallback: '代码'
    },
    en: {
        headerTitle: 'Simple Message Board',
        headerSubtitle: function ({ max }) { return 'Supports Markdown posts. Press Ctrl + Enter to submit. Keeps up to ' + max + ' entries.'; },
        statsTotal: function ({ total }) { return 'Total ' + total + ' messages'; },
        statsMatches: function ({ total }) { return total + ' result' + (total === 1 ? '' : 's') + ' found'; },
        submitButton: 'Submit Message',
        toolbarHeading1: 'H1',
        toolbarHeading2: 'H2',
        toolbarBold: 'Bold',
        toolbarItalic: 'Italic',
        toolbarListUl: '• List',
        toolbarListOl: '1. List',
        toolbarInlineCode: 'Inline Code',
        toolbarCodeBlock: 'Code Block',
        toolbarQuote: 'Quote',
        toolbarLink: 'Link',
        textareaPlaceholder: 'Try **Markdown** syntax — code blocks, lists, etc.',
        tagsPlaceholder: 'Add tags (comma or space separated)',
        searchTitle: 'Search Messages',
        searchSubtitle: 'Supports fuzzy matching and keeps pagination',
        searchButton: 'Search',
        searchClear: 'Clear',
        searchPlaceholder: 'Enter keywords',
        searchFilter: function ({ term }) { return 'Filter: ' + term; },
        languageZh: 'Chinese',
        languageEn: 'English',
        themeLight: 'Light',
        themeDark: 'Dark',
        paginationLabel: function ({ current, totalpages }) { return 'Page ' + current + ' / ' + totalpages; },
        paginationPrev: 'Previous',
        paginationNext: 'Next',
        emptyDefault: 'No messages yet — be the first!',
        emptySearch: function ({ term }) { return 'No messages found containing "' + term + '".'; },
        copyButton: 'Copy',
        copySuccess: 'Copied',
        copyFailure: 'Copy failed',
        deleteButton: 'Delete',
        codeFallback: 'Code'
    }
};

function decodeEntities(value = '') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value;
    return textarea.value;
}

function getParams(el) {
    const params = {};
    for (const [name, raw] of Object.entries(el.dataset)) {
        if (name.startsWith('i18n')) {
            continue;
        }
        let value = raw;
        if (HTML_PARAM_KEYS.has(name)) {
            value = decodeEntities(value);
        }
        const numeric = Number(value);
        params[name] = Number.isFinite(numeric) && value !== '' ? numeric : value;
    }
    return params;
}

function t(key, vars = {}, lang = currentLanguage) {
    const dict = translations[lang] || translations.zh;
    const value = dict[key] ?? translations.zh[key];
    if (typeof value === 'function') {
        return value(vars);
    }
    return value !== undefined ? value : key;
}

function applyLanguage(mode) {
    currentLanguage = mode;
    const languageOption = LANGUAGE_OPTIONS[mode] || LANGUAGE_OPTIONS.zh;
    document.documentElement.setAttribute('lang', languageOption.locale);
    const themeMode = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

    document.querySelectorAll('[data-i18n]').forEach((element) => {
        const key = element.dataset.i18n;
        if (!key) return;
        const params = getParams(element);
        let value = t(key, params, mode);
        if (element.dataset.uppercase === 'true' && typeof value === 'string') {
            value = value.toUpperCase();
        }
        element.textContent = value;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
        const key = element.dataset.i18nPlaceholder;
        if (!key) return;
        const params = getParams(element);
        element.setAttribute('placeholder', t(key, params, mode));
    });

    document.title = t('headerTitle', {}, mode);
    updateThemeToggle(themeMode);
    updateLanguageToggle(mode);
}

function initializeLanguage() {
    const toggle = document.getElementById('language-toggle');
    let stored = null;
    try {
        stored = localStorage.getItem(LANGUAGE_KEY);
    } catch (error) {
        stored = null;
    }
    const initial = stored && LANGUAGE_OPTIONS[stored] ? stored : 'zh';
    applyLanguage(initial);
    if (stored !== initial) {
        persistLanguage(initial);
    }

    toggle?.addEventListener('click', () => {
        const next = currentLanguage === 'zh' ? 'en' : 'zh';
        persistLanguage(next);
        applyLanguage(next);
    });
}

function updateLanguageToggle(mode) {
    const toggle = document.getElementById('language-toggle');
    if (!toggle) return;
    const label = toggle.querySelector('.language-toggle-label');
    const option = LANGUAGE_OPTIONS[mode] || LANGUAGE_OPTIONS.zh;
    if (label) {
        label.textContent = option.label;
    }
}

function persistLanguage(value) {
    try {
        localStorage.setItem(LANGUAGE_KEY, value);
    } catch (error) {
        // ignore
    }
}

function initializeTheme() {
    const root = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    let stored = null;
    try {
        stored = localStorage.getItem('theme');
    } catch (error) {
        stored = null;
    }

    const preferred = media.matches ? 'dark' : 'light';
    const initial = stored === 'dark' || stored === 'light' ? stored : preferred;

    applyTheme(initial);

    if (!stored) {
        persistTheme(initial);
    }

    themeToggle?.addEventListener('click', () => {
        const nextTheme = root.classList.contains('dark') ? 'light' : 'dark';
        persistTheme(nextTheme);
        applyTheme(nextTheme);
    });

    media.addEventListener('change', (event) => {
        let saved = null;
        try {
            saved = localStorage.getItem('theme');
        } catch (error) {
            saved = null;
        }
        if (saved === 'light' || saved === 'dark') {
            return;
        }
        applyTheme(event.matches ? 'dark' : 'light');
    });
}

function applyTheme(mode) {
    const root = document.documentElement;
    root.classList.toggle('dark', mode === 'dark');
    updateThemeToggle(mode);
}

function updateThemeToggle(mode) {
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    const icon = button.querySelector('span[aria-hidden="true"]');
    const label = button.querySelector('.theme-toggle-label');
    if (icon) {
        icon.textContent = mode === 'dark' ? '🌙' : '☀️';
    }
    if (label) {
        label.textContent = mode === 'dark' ? t('themeDark') : t('themeLight');
    }
}

function persistTheme(value) {
    try {
        localStorage.setItem('theme', value);
    } catch (error) {
        // ignore storage errors
    }
}

function applyMarkdown(textarea, action) {
    if (!action) return;

    textarea.focus();

    let start = textarea.selectionStart;
    let end = textarea.selectionEnd;
    if (start === null || start === undefined || Number.isNaN(start)) {
        start = textarea.value.length;
    }
    if (end === null || end === undefined || Number.isNaN(end)) {
        end = start;
    }

    const value = textarea.value;
    const selected = value.slice(start, end);
    let replacement = selected;
    let innerStart = 0;
    let innerEnd = replacement.length;
    const tick = String.fromCharCode(96);
    const fence = tick.repeat(3);

    const selectAll = function () {
        innerStart = 0;
        innerEnd = replacement.length;
    };

    switch (action) {
        case 'heading-1': {
            const text = selected || '标题';
            replacement = '# ' + text;
            innerStart = 2;
            innerEnd = innerStart + text.length;
            break;
        }
        case 'heading-2': {
            const text = selected || '小标题';
            replacement = '## ' + text;
            innerStart = 3;
            innerEnd = innerStart + text.length;
            break;
        }
        case 'bold': {
            const text = selected || '文本';
            replacement = '**' + text + '**';
            innerStart = 2;
            innerEnd = innerStart + text.length;
            break;
        }
        case 'italic': {
            const text = selected || '文本';
            replacement = '*' + text + '*';
            innerStart = 1;
            innerEnd = innerStart + text.length;
            break;
        }
        case 'list-ul': {
            const source = selected || '列表项';
            const lines = source.split(/\r?\n/);
            replacement = lines.map((line) => '- ' + (line || '列表项')).join('\n');
            selectAll();
            break;
        }
        case 'list-ol': {
            const source = selected || '列表项';
            const lines = source.split(/\r?\n/);
            replacement = lines.map((line, index) => (index + 1) + '. ' + (line || '列表项')).join('\n');
            selectAll();
            break;
        }
        case 'code': {
            const text = selected || '代码';
            replacement = tick + text + tick;
            innerStart = 1;
            innerEnd = innerStart + text.length;
            break;
        }
        case 'code-block': {
            const text = selected || '代码';
            replacement = fence + '\n' + text + '\n' + fence + '\n';
            innerStart = fence.length + 1;
            innerEnd = innerStart + text.length;
            break;
        }
        case 'quote': {
            const source = selected || '引用内容';
            const lines = source.split(/\r?\n/);
            replacement = lines.map((line) => '> ' + (line || '引用内容')).join('\n');
            selectAll();
            break;
        }
        case 'link': {
            const text = selected || '链接文本';
            replacement = '[' + text + '](https://example.com)';
            innerStart = 1;
            innerEnd = innerStart + text.length;
            break;
        }
        default:
            return;
    }

    const before = value.slice(0, start);
    const after = value.slice(end);
    textarea.value = before + replacement + after;

    const offset = before.length;
    textarea.setSelectionRange(offset + innerStart, offset + innerEnd);
    textarea.focus();
    textarea.dispatchEvent(new Event('input'));
}

function initializeMarkdownRendering() {
    if (window.marked) {
        marked.setOptions({
            gfm: true,
            breaks: true,
            smartypants: true,
            highlight: (code, language) => {
                if (window.hljs) {
                    if (language && hljs.getLanguage(language)) {
                        return hljs.highlight(code, { language }).value;
                    }
                    return hljs.highlightAuto(code).value;
                }
                return code;
            }
        });
    }

    const blocks = document.querySelectorAll('[data-markdown]');
    blocks.forEach((element) => {
        const markdownText = element.getAttribute('data-markdown') || '';
        if (window.marked) {
            const rawHtml = marked.parse(markdownText);
            const safeHtml = window.DOMPurify ? DOMPurify.sanitize(rawHtml) : rawHtml;
            element.innerHTML = safeHtml;
        } else {
            element.textContent = markdownText;
        }
    });

    if (window.hljs) {
        const codeBlocks = document.querySelectorAll('.message-content pre code');
        codeBlocks.forEach((block) => window.hljs.highlightElement(block));
    }

    enhanceCodeBlocks();
}

function fallbackCopy(text, onComplete) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        onComplete('copySuccess');
    } catch (error) {
        onComplete('copyFailure');
    } finally {
        document.body.removeChild(textarea);
    }
}

function wrapCodeBlock(pre) {
    if (pre.dataset.enhanced === 'true') {
        return;
    }

    const codeElement = pre.querySelector('code') || pre;
    if (!codeElement) {
        return;
    }

    pre.dataset.enhanced = 'true';

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper group overflow-hidden rounded-xl border border-border bg-muted/30 text-foreground shadow-sm backdrop-blur';

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between border-b border-border/70 bg-muted/50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground';

    const title = document.createElement('span');
    const languageMatch = (codeElement.className || '').match(/language-([\w-]+)/i);
    if (languageMatch && languageMatch[1]) {
        title.textContent = languageMatch[1].toUpperCase();
    } else {
        title.dataset.i18n = 'codeFallback';
        title.dataset.uppercase = 'true';
        title.textContent = t('codeFallback').toUpperCase();
    }
    header.appendChild(title);

    const actions = document.createElement('div');
    actions.className = 'flex items-center gap-2';

    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.className = 'inline-flex items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1 text-[11px] font-medium tracking-wide text-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring';
    copyButton.dataset.i18n = 'copyButton';
    copyButton.textContent = t('copyButton');

    copyButton.addEventListener('click', () => {
        const originalText = codeElement.innerText;
        const reset = () => {
            copyButton.textContent = t('copyButton');
        };

        const finish = (messageKey) => {
            copyButton.textContent = t(messageKey);
            setTimeout(reset, 1600);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(originalText).then(() => {
                finish('copySuccess');
            }).catch(() => {
                fallbackCopy(originalText, finish);
            });
        } else {
            fallbackCopy(originalText, finish);
        }
    });

    actions.appendChild(copyButton);
    header.appendChild(actions);

    const body = document.createElement('div');
    body.className = 'relative bg-background/80 transition-colors';

    pre.classList.add('m-0', 'max-h-[60vh]', 'overflow-auto', 'bg-transparent', 'p-4', 'text-sm', 'leading-6');

    const parent = pre.parentNode;
    if (parent) {
        wrapper.appendChild(header);
        parent.replaceChild(wrapper, pre);
        body.appendChild(pre);
        wrapper.appendChild(body);
    }
}

function enhanceCodeBlocks() {
    const blocks = document.querySelectorAll('.message-content pre');
    blocks.forEach(wrapCodeBlock);
}

function enhanceCodeBlockSingle(pre) {
    wrapCodeBlock(pre);
}

function initializeAutoRefresh() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get('page'), 10) || 1;
    const searchQuery = urlParams.get('q') || '';
    const tagFilter = urlParams.get('tag') || '';

    // 禁用自动刷新：如果不在第一页，或有搜索/标签过滤
    if (currentPage !== 1 || searchQuery.trim() !== '' || tagFilter.trim() !== '') {
        return;
    }

    const messageList = document.querySelector('ul.space-y-4');
    if (!messageList) {
        return;
    }

    const existingMessages = messageList.querySelectorAll('li[data-message-id]');
    let latestId = 0;
    existingMessages.forEach((li) => {
        const id = parseInt(li.dataset.messageId, 10);
        if (!Number.isNaN(id) && id > latestId) {
            latestId = id;
        }
    });

    const POLL_INTERVAL = 5000;

    const pollNewMessages = async () => {
        try {
            const response = await fetch('/api/messages?since_id=' + latestId + '&limit=50');
            if (!response.ok) {
                return;
            }

            const data = await response.json();
            if (!data.messages || data.messages.length === 0) {
                return;
            }

            data.messages.forEach((msg) => {
                if (msg.id > latestId) {
                    latestId = msg.id;
                }
                insertNewMessage(msg, messageList);
            });

            updateStatsCounter(data.messages.length);
        } catch (error) {
            console.error('Failed to poll new messages:', error);
        }
    };

    setInterval(pollNewMessages, POLL_INTERVAL);
}

function insertNewMessage(message, listElement) {
    const existingItem = listElement.querySelector('li[data-message-id="' + message.id + '"]');
    if (existingItem) {
        return;
    }

    const emptyPlaceholder = listElement.querySelector('li[data-i18n="emptyDefault"]');
    if (emptyPlaceholder) {
        emptyPlaceholder.remove();
    }

    const safeMarkdown = escapeAttributeClient(message.content);
    const fallbackHtml = escapeHtmlClient(message.content);
    const displayTime = formatDisplayTimeClient(message.created_at);

    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get('page'), 10) || 1;

    // 渲染标签
    let tagsHtml = '';
    if (message.tags && message.tags.length > 0) {
        tagsHtml = '<div class="flex flex-wrap gap-1.5 mt-3">';
        message.tags.forEach(function(tag) {
            tagsHtml += '<a href="/?tag=' + tag.id + '" class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors hover:opacity-80" style="background-color: ' + tag.color + '20; color: ' + tag.color + '; border: 1px solid ' + tag.color + '40;">' +
                escapeHtmlClient(tag.name) +
                '</a>';
        });
        tagsHtml += '</div>';
    }

    const li = document.createElement('li');
    li.className = 'rounded-xl border border-border bg-card text-card-foreground shadow-sm transition hover:-translate-y-[1px] hover:shadow-md';
    li.dataset.messageId = message.id;
    li.style.animation = 'slideIn 0.35s ease-out';

    li.innerHTML = '<div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">' +
        '<div class="flex-1 min-w-0">' +
        '<p class="text-xs font-medium text-muted-foreground mb-2">' + displayTime + '</p>' +
        '<div class="message-content prose prose-slate max-w-none text-sm dark:prose-invert" data-markdown="' + safeMarkdown + '">' + fallbackHtml + '</div>' +
        tagsHtml +
        '</div>' +
        '<form action="/delete" method="post" class="flex shrink-0 items-center justify-end sm:self-start">' +
        '<input type="hidden" name="id" value="' + message.id + '">' +
        '<input type="hidden" name="page" value="' + currentPage + '">' +
        '<button type="submit" class="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border border-destructive/40 bg-destructive/10 px-3 text-xs font-medium text-destructive shadow-sm transition hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-i18n="deleteButton">' + t('deleteButton') + '</button>' +
        '</form>' +
        '</div>';

    listElement.insertBefore(li, listElement.firstChild);

    const contentElement = li.querySelector('.message-content');
    if (contentElement && window.marked) {
        const rawHtml = marked.parse(message.content);
        const safeHtml = window.DOMPurify ? DOMPurify.sanitize(rawHtml) : rawHtml;
        contentElement.innerHTML = safeHtml;
    }

    if (window.hljs) {
        const codeBlocks = contentElement.querySelectorAll('pre code');
        codeBlocks.forEach((block) => window.hljs.highlightElement(block));
    }

    const preElements = contentElement.querySelectorAll('pre');
    preElements.forEach((pre) => {
        if (pre.dataset.enhanced !== 'true') {
            enhanceCodeBlockSingle(pre);
        }
    });
}

function escapeAttributeClient(value = '') {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\r?\n/g, '&#10;');
}

function escapeHtmlClient(value = '') {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\r?\n/g, '<br>');
}

function formatDisplayTimeClient(isoString) {
    const date = isoString ? new Date(isoString) : new Date();
    if (Number.isNaN(date.getTime())) {
        return new Date().toLocaleString('zh-CN', { hour12: false });
    }
    return date.toLocaleString('zh-CN', { hour12: false });
}

function updateStatsCounter(increment) {
    const statsElement = document.querySelector('[data-i18n="statsTotal"]');
    if (statsElement) {
        const currentTotal = parseInt(statsElement.dataset.total, 10) || 0;
        const newTotal = currentTotal + increment;
        statsElement.dataset.total = newTotal;
        statsElement.textContent = t('statsTotal', { total: newTotal });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeLanguage();
    initializeTheme();
    initializeMarkdownRendering();
    initializeAutoRefresh();

    const textarea = document.getElementById('message');
    if (textarea) {
        textarea.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && event.ctrlKey) {
                event.preventDefault();
                textarea.form?.submit();
            }
        });

        const toolbarButtons = document.querySelectorAll('.toolbar-btn');
        toolbarButtons.forEach((button) => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                const action = button.getAttribute('data-action');
                applyMarkdown(textarea, action);
            });
        });
    }
});
