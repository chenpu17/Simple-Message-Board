const { MAX_MESSAGES } = require('../config');
const { escapeAttribute, escapeHtml, formatDisplayTime } = require('../utils/format');
const { buildListPath } = require('../utils/paths');

function renderMessageItem({ id, content, created_at, tags }, currentPage, searchTerm, tagFilter) {
    const safeMarkdown = escapeAttribute(content);
    const fallbackHtml = escapeHtml(content);
    const displayTime = formatDisplayTime(created_at);
    const searchHidden = searchTerm ? `<input type="hidden" name="q" value="${escapeAttribute(searchTerm)}">` : '';
    const tagHidden = tagFilter ? `<input type="hidden" name="tag" value="${escapeAttribute(tagFilter)}">` : '';

    // 渲染标签
    const tagsHtml = tags && tags.length > 0
        ? `<div class="flex flex-wrap gap-1.5 mt-3">
            ${tags.map(tag => `
                <a href="/?tag=${tag.id}" class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors hover:opacity-80" style="background-color: ${tag.color}20; color: ${tag.color}; border: 1px solid ${tag.color}40;">
                    ${escapeHtml(tag.name)}
                </a>
            `).join('')}
           </div>`
        : '';

    return `
        <li class="rounded-xl border border-border bg-card text-card-foreground shadow-sm transition hover:-translate-y-[1px] hover:shadow-md" data-message-id="${id}">
            <div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium text-muted-foreground mb-2">${displayTime}</p>
                    <div class="message-content prose prose-slate max-w-none text-sm dark:prose-invert" data-markdown="${safeMarkdown}">${fallbackHtml}</div>
                    ${tagsHtml}
                </div>
                <form action="/delete" method="post" class="flex shrink-0 items-center justify-end sm:self-start">
                    <input type="hidden" name="id" value="${id}">
                    <input type="hidden" name="page" value="${currentPage}">
                    ${searchHidden}
                    ${tagHidden}
                    <button type="submit" class="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border border-destructive/40 bg-destructive/10 px-3 text-xs font-medium text-destructive shadow-sm transition hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-i18n="deleteButton">删除</button>
                </form>
            </div>
        </li>
    `;
}

function renderPagination(currentPage, totalPages, searchTerm = '', tagFilter = '') {
    if (totalPages <= 1) {
        return '';
    }

    const prevPage = currentPage > 1 ? currentPage - 1 : 1;
    const nextPage = currentPage < totalPages ? currentPage + 1 : totalPages;

    const linkBase = 'inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-md border border-input px-3 text-xs font-medium transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
    const disabled = 'cursor-not-allowed bg-muted text-muted-foreground';
    const active = 'bg-primary text-primary-foreground shadow hover:bg-primary/90';

    const pages = Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1;
        const isActive = page === currentPage;
        return `<a href="${buildListPath(page, searchTerm, tagFilter)}" class="${linkBase} ${isActive ? active : ''}">${page}</a>`;
    }).join('');

    return `
        <nav class="flex flex-col gap-3 rounded-xl border border-border bg-card/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div class="text-xs text-muted-foreground" data-i18n="paginationLabel" data-current="${currentPage}" data-totalpages="${totalPages}">第 ${currentPage} / ${totalPages} 页</div>
            <div class="flex flex-wrap items-center gap-2">
                <a href="${buildListPath(prevPage, searchTerm, tagFilter)}" class="${linkBase} ${currentPage === 1 ? disabled : ''}" data-i18n="paginationPrev">上一页</a>
                <div class="flex flex-wrap items-center gap-1">${pages}</div>
                <a href="${buildListPath(nextPage, searchTerm, tagFilter)}" class="${linkBase} ${currentPage === totalPages ? disabled : ''}" data-i18n="paginationNext">下一页</a>
            </div>
        </nav>
    `;
}

function renderList(messages, searchTerm, currentPage, tagFilter) {
    if (messages.length === 0 && searchTerm) {
        const searchValueAttr = escapeAttribute(searchTerm);
        const searchValueHtml = escapeHtml(searchTerm);
        return `
            <li class="rounded-xl border border-dashed border-border bg-card/70 p-12 text-center text-sm text-muted-foreground" data-i18n="emptySearch" data-term="${searchValueAttr}">
                没有找到包含 "${searchValueHtml}" 的留言。
            </li>
        `;
    }

    if (messages.length === 0) {
        return `
            <li class="rounded-xl border border-dashed border-border bg-card/70 p-12 text-center text-sm text-muted-foreground" data-i18n="emptyDefault">
                还没有留言，快来留下第一条消息吧～
            </li>
        `;
    }

    return messages.map((message) => renderMessageItem(message, currentPage, searchTerm, tagFilter)).join('');
}

function renderTagSidebar(allTags, tagFilter) {
    if (!allTags || allTags.length === 0) {
        return '';
    }

    const currentTagId = tagFilter ? String(tagFilter) : null;

    const tagItems = allTags.map(tag => {
        const isActive = currentTagId === String(tag.id);
        const activeClass = isActive ? 'border-r-4 pr-2' : 'border-r-2 pr-3';
        const bgClass = isActive ? 'bg-card shadow-lg' : 'bg-card/80 hover:bg-card hover:shadow-md';

        return `
            <a href="/?tag=${tag.id}"
               class="group relative flex items-center justify-between gap-2 py-1.5 px-2 text-xs transition-all rounded-l-md ${activeClass} ${bgClass}"
               style="border-right-color: ${tag.color};"
               title="${escapeAttribute(tag.name)} (${tag.message_count} 条留言)">
                <span class="flex items-center gap-1.5 min-w-0 flex-1">
                    <span class="inline-block h-1.5 w-1.5 rounded-full flex-shrink-0" style="background-color: ${tag.color};"></span>
                    <span class="truncate font-medium transition-colors" style="color: ${tag.color};">${escapeHtml(tag.name)}</span>
                </span>
                <span class="flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold" style="background-color: ${tag.color}; color: white;">
                    ${tag.message_count}
                </span>
            </a>
        `;
    }).join('');

    return `
        <aside class="fixed left-0 top-24 z-10 w-32 hidden lg:block">
            <div class="rounded-l-xl border border-r-0 border-border bg-card/95 shadow-lg backdrop-blur overflow-hidden">
                <div class="border-b border-border px-2 py-1.5 bg-muted/50">
                    <div class="flex items-center justify-between">
                        <h2 class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">标签</h2>
                        ${currentTagId ? `<a href="/" class="text-[9px] text-primary hover:underline">清除</a>` : ''}
                    </div>
                </div>
                <div class="max-h-[calc(100vh-8rem)] overflow-y-auto py-1">
                    ${tagItems}
                </div>
            </div>
        </aside>
    `;
}

function renderHomePage({ messages, searchTerm, totalMessages, totalPages, currentPage, tagFilter, allTags = [] }) {
    const listItems = renderList(messages, searchTerm, currentPage, tagFilter);
    const pagination = renderPagination(currentPage, totalPages, searchTerm, tagFilter);
    const searchValueAttr = escapeAttribute(searchTerm);
    const searchValueHtml = escapeHtml(searchTerm);

    // 渲染标签导航栏
    const tagSidebar = renderTagSidebar(allTags, tagFilter);

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>简易留言板</title>
    <script>
        (function() {
            try {
                const storedTheme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                }
            } catch (error) {
                // ignore
            }
        })();
    </script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        border: 'hsl(var(--border))',
                        input: 'hsl(var(--input))',
                        ring: 'hsl(var(--ring))',
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        primary: {
                            DEFAULT: 'hsl(var(--primary))',
                            foreground: 'hsl(var(--primary-foreground))'
                        },
                        secondary: {
                            DEFAULT: 'hsl(var(--secondary))',
                            foreground: 'hsl(var(--secondary-foreground))'
                        },
                        destructive: {
                            DEFAULT: 'hsl(var(--destructive))',
                            foreground: 'hsl(var(--destructive-foreground))'
                        },
                        muted: {
                            DEFAULT: 'hsl(var(--muted))',
                            foreground: 'hsl(var(--muted-foreground))'
                        },
                        accent: {
                            DEFAULT: 'hsl(var(--accent))',
                            foreground: 'hsl(var(--accent-foreground))'
                        },
                        card: {
                            DEFAULT: 'hsl(var(--card))',
                            foreground: 'hsl(var(--card-foreground))'
                        }
                    },
                    borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)'
                    },
                    fontFamily: {
                        sans: ['Inter', 'system-ui', 'sans-serif'],
                        mono: ['JetBrains Mono', 'monospace']
                    }
                }
            }
        };
    </script>
    <style>
        :root {
            color-scheme: light;
            --background: 0 0% 100%;
            --foreground: 222.2 47.4% 11.2%;
            --muted: 210 40% 96.1%;
            --muted-foreground: 215.4 16.3% 46.9%;
            --popover: 0 0% 100%;
            --popover-foreground: 222.2 47.4% 11.2%;
            --border: 214.3 31.8% 91.4%;
            --input: 214.3 31.8% 91.4%;
            --card: 0 0% 100%;
            --card-foreground: 222.2 47.4% 11.2%;
            --primary: 221.2 83.2% 53.3%;
            --primary-foreground: 210 40% 98%;
            --secondary: 210 40% 96.1%;
            --secondary-foreground: 222.2 47.4% 11.2%;
            --accent: 210 40% 96.1%;
            --accent-foreground: 222.2 47.4% 11.2%;
            --destructive: 0 72.2% 50.6%;
            --destructive-foreground: 210 40% 98%;
            --ring: 221.2 83.2% 53.3%;
            --radius: 0.9rem;
        }

        .dark {
            color-scheme: dark;
            --background: 222.2 84% 4.9%;
            --foreground: 210 40% 98%;
            --muted: 217.2 32.6% 17.5%;
            --muted-foreground: 215 20.2% 65.1%;
            --popover: 222.2 84% 4.9%;
            --popover-foreground: 210 40% 98%;
            --border: 217.2 32.6% 17.5%;
            --input: 217.2 32.6% 17.5%;
            --card: 222.2 84% 4.9%;
            --card-foreground: 210 40% 98%;
            --primary: 217.2 91.2% 59.8%;
            --primary-foreground: 222.2 47.4% 11.2%;
            --secondary: 217.2 32.6% 17.5%;
            --secondary-foreground: 210 40% 98%;
            --accent: 217.2 32.6% 17.5%;
            --accent-foreground: 210 40% 98%;
            --destructive: 0 62.8% 45.6%;
            --destructive-foreground: 210 40% 98%;
            --ring: 224.3 76.3% 48%;
        }
    </style>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600|jetbrains-mono:400,500" rel="stylesheet" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="/static/app.css">
</head>
<body class="min-h-screen bg-background text-foreground">
    ${tagSidebar}
    <div class="relative isolate">
        <div class="pointer-events-none absolute inset-x-0 top-[-14rem] -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
            <div class="relative left-1/2 aspect-[1108/632] w-[72rem] -translate-x-1/2 bg-gradient-to-tr from-indigo-300 via-sky-200 to-purple-200 opacity-60 dark:from-indigo-950 dark:via-slate-800 dark:to-purple-900"></div>
        </div>
        <main class="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <div class="flex flex-col gap-6">
                <section class="flex flex-col gap-4 rounded-2xl border border-border bg-card/90 p-6 shadow-lg shadow-black/5 backdrop-blur">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div class="space-y-2">
                            <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">shadcn-style</p>
                            <h1 class="text-3xl font-semibold tracking-tight" data-i18n="headerTitle">简易留言板</h1>
                            <p class="text-sm text-muted-foreground" data-i18n="headerSubtitle" data-max="${MAX_MESSAGES}">支持 Markdown 留言，按 Ctrl + Enter 快速提交。最多保留 ${MAX_MESSAGES} 条。</p>
                        </div>
                        <div class="flex items-center gap-3 self-end sm:self-auto">
                            <span class="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground" data-i18n="${searchTerm ? 'statsMatches' : 'statsTotal'}" data-total="${totalMessages}">${searchTerm ? `共 ${totalMessages} 条匹配` : `共 ${totalMessages} 条留言`}</span>
                            <button type="button" id="language-toggle" class="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                <span aria-hidden="true">🌐</span>
                                <span class="language-toggle-label" data-i18n="languageZh">中文</span>
                            </button>
                            <button type="button" id="theme-toggle" class="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                <span aria-hidden="true">☀️</span>
                                <span class="theme-toggle-label">亮色</span>
                            </button>
                        </div>
                    </div>
                    <form action="/submit" method="post" class="space-y-3">
                        <div class="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 shadow-inner shadow-black/5">
                            ${renderToolbarButton('heading-1', 'toolbarHeading1', 'H1')}
                            ${renderToolbarButton('heading-2', 'toolbarHeading2', 'H2')}
                            ${renderToolbarButton('bold', 'toolbarBold', 'B')}
                            ${renderToolbarButton('italic', 'toolbarItalic', 'I')}
                            ${renderToolbarButton('list-ul', 'toolbarListUl', '• 列表')}
                            ${renderToolbarButton('list-ol', 'toolbarListOl', '1. 列表')}
                            ${renderToolbarButton('code', 'toolbarInlineCode', '</>')}
                            ${renderToolbarButton('code-block', 'toolbarCodeBlock', 'Code')}
                            ${renderToolbarButton('quote', 'toolbarQuote', '" "')}
                            ${renderToolbarButton('link', 'toolbarLink', 'Link')}
                        </div>
                        <textarea id="message" name="message" rows="5" required placeholder="试试使用 **Markdown** 语法，支持代码块、列表等格式。" class="block w-full rounded-lg border border-input bg-background px-4 py-3 text-sm leading-6 text-foreground shadow-inner shadow-black/5 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40" data-i18n-placeholder="textareaPlaceholder"></textarea>
                        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                            <div class="flex flex-1 items-center gap-2 rounded-md border border-input bg-background px-4 py-2.5 text-sm text-foreground shadow-inner shadow-black/5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4 opacity-70 flex-shrink-0">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
                                </svg>
                                <input type="text" name="tags" placeholder="添加标签（用逗号或空格分隔）" class="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/80 focus:outline-none" data-i18n-placeholder="tagsPlaceholder">
                            </div>
                            <button type="submit" class="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-i18n="submitButton">提交留言</button>
                        </div>
                    </form>
                </section>

                <section class="rounded-2xl border border-border bg-card/90 p-5 shadow-sm shadow-black/5">
                    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <div class="flex flex-wrap items-center gap-2">
                            <h2 class="text-sm font-semibold" data-i18n="searchTitle">搜索留言</h2>
                            <span class="text-xs text-muted-foreground" data-i18n="searchSubtitle">支持模糊匹配并保留分页</span>
                        </div>
                        ${searchTerm ? `<span class="text-xs font-medium text-primary" data-i18n="searchFilter" data-term="${searchValueAttr}">已筛选：${searchValueHtml}</span>` : ''}
                    </div>
                    <form action="/" method="get" class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                        <div class="flex flex-1 items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm text-foreground shadow-inner shadow-black/5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4 opacity-70">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.35-4.35m0 0a7.5 7.5 0 1 0-10.607-10.607 7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                            <input type="search" name="q" value="${searchValueAttr}" placeholder="输入关键字" class="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/80 focus:outline-none" data-i18n-placeholder="searchPlaceholder">
                        </div>
                        <div class="flex items-center gap-2">
                            <button type="submit" class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-i18n="searchButton">搜索</button>
                            ${searchTerm ? `<a href="/" class="text-xs font-medium text-muted-foreground transition hover:text-foreground" data-i18n="searchClear">清除</a>` : ''}
                        </div>
                    </form>
                </section>

                <section class="space-y-6">
                    <ul class="space-y-4">
                        ${listItems}
                    </ul>
                    ${pagination}
                </section>
            </div>
        </main>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js" referrerpolicy="no-referrer"></script>
    <script src="/static/app.js"></script>
</body>
</html>
    `;
}

function renderToolbarButton(action, key, label) {
    return `
        <button type="button" class="toolbar-btn inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-action="${action}" data-i18n="${key}">${label}</button>
    `;
}

module.exports = { renderHomePage };
