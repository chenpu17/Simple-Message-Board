const { MAX_MESSAGES } = require('../config');
const { escapeAttribute, escapeHtml, formatDisplayTime } = require('../utils/format');
const { buildListPath } = require('../utils/paths');

function renderMessageItem({ id, content, created_at, tags }, currentPage, searchTerm, tagFilter) {
    const safeMarkdown = escapeAttribute(content);
    const fallbackHtml = escapeHtml(content);
    const displayTime = formatDisplayTime(created_at);
    const searchHidden = searchTerm ? `<input type="hidden" name="q" value="${escapeAttribute(searchTerm)}">` : '';
    const tagHidden = tagFilter ? `<input type="hidden" name="tag" value="${escapeAttribute(tagFilter)}">` : '';

    // 渲染标签 - 传递所有标签到前端，由前端根据屏幕宽度自适应显示
    const tagsHtml = tags && tags.length > 0
        ? `<div class="message-tags flex flex-wrap gap-2 mt-3" data-all-tags='${escapeAttribute(JSON.stringify(tags))}'>
            ${tags.map(tag => `
                <a href="/?tag=${tag.id}"
                   class="tag-item group inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all hover:brightness-105 active:scale-95"
                   style="background-color: ${tag.color}10; color: ${tag.color}; border: 1px solid ${tag.color}20;"
                   data-usage-count="${tag.usage_count || 0}">
                    <span class="opacity-50 transition-opacity group-hover:opacity-70">#</span>
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
                    <button type="submit" class="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border border-destructive/40 bg-destructive/10 px-3 text-xs font-medium text-destructive shadow-sm transition hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-i18n-title="deleteButton">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        <span data-i18n="deleteButton">删除</span>
                    </button>
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
            <li class="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center transition-all hover:bg-card/80">
                <div class="rounded-full bg-muted p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground/60"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
                <div class="space-y-1">
                    <p class="text-sm font-medium text-foreground" data-i18n="emptySearch" data-term="${searchValueAttr}">没有找到包含 "${searchValueHtml}" 的留言。</p>
                    <p class="text-xs text-muted-foreground">试试其他关键字？</p>
                </div>
            </li>
        `;
    }

    if (messages.length === 0) {
        return `
            <li class="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center transition-all hover:bg-card/80">
                <div class="rounded-full bg-muted p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground/60"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div class="space-y-1">
                    <p class="text-sm font-medium text-foreground" data-i18n="emptyDefault">还没有留言，快来留下第一条消息吧～</p>
                </div>
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
        let classes = "group flex items-center justify-between gap-2 py-2 px-2.5 text-xs transition-all rounded-md mb-1";
        let style = "";
        let countStyle = "";

        if (isActive) {
            classes += " font-medium shadow-sm ring-1 ring-inset";
            style = `background-color: ${tag.color}15; color: ${tag.color}; --tw-ring-color: ${tag.color}40;`;
            countStyle = `background-color: ${tag.color}; color: white;`;
        } else {
            classes += " text-muted-foreground hover:bg-muted/60 hover:text-foreground";
            style = "";
            countStyle = "background-color: var(--muted); color: var(--muted-foreground);";
        }

        return `
            <a href="/?tag=${tag.id}"
               class="${classes}"
               style="${style}"
               title="${escapeAttribute(tag.name)}">
                <span class="flex items-center gap-2 min-w-0 flex-1">
                    <span class="inline-block h-1.5 w-1.5 rounded-full flex-shrink-0 shadow-sm" style="background-color: ${tag.color};"></span>
                    <span class="truncate relative top-[0.5px]">${escapeHtml(tag.name)}</span>
                </span>
                <span class="flex-shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold transition-colors group-hover:bg-background/80" style="${countStyle}">
                    ${tag.message_count}
                </span>
            </a>
        `;
    }).join('');

    return `
        <aside class="fixed left-0 top-24 z-10 w-40 hidden xl:block pl-6">
            <div class="rounded-xl border border-border bg-card/50 shadow-sm backdrop-blur-sm">
                <div class="border-b border-border/50 px-3 py-2.5">
                    <div class="flex items-center justify-between">
                        <h2 class="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
                            标签
                        </h2>
                        ${currentTagId ? `<a href="/" class="text-[10px] text-muted-foreground hover:text-primary transition-colors">清除</a>` : ''}
                    </div>
                </div>
                <div class="max-h-[calc(100vh-10rem)] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
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
                        <div class="flex flex-wrap items-center gap-1 rounded-t-lg border border-b-0 border-border bg-muted/40 px-2 py-2">
                            ${renderToolbarButton('heading-1', 'toolbarHeading1', '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="m17 12 3-2v8"/></svg>')}
                            ${renderToolbarButton('heading-2', 'toolbarHeading2', '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"/></svg>')}
                            <div class="mx-1 h-4 w-[1px] bg-border"></div>
                            ${renderToolbarButton('bold', 'toolbarBold', '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 12a4 4 0 0 0 0-8H6v8"/><path d="M15 20a4 4 0 0 0 0-8H6v8Z"/></svg>')}
                            ${renderToolbarButton('italic', 'toolbarItalic', '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/></svg>')}
                            ${renderToolbarButton('quote', 'toolbarQuote', '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/></svg>')}
                            <div class="mx-1 h-4 w-[1px] bg-border"></div>
                            ${renderToolbarButton('list-ul', 'toolbarListUl', '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>')}
                            ${renderToolbarButton('list-ol', 'toolbarListOl', '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>')}
                            <div class="mx-1 h-4 w-[1px] bg-border"></div>
                            ${renderToolbarButton('code', 'toolbarInlineCode', '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>')}
                            ${renderToolbarButton('code-block', 'toolbarCodeBlock', '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 10 2 2-2 2"/><path d="m15 14-2-2 2-2"/></svg>')}
                            ${renderToolbarButton('link', 'toolbarLink', '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>')}
                        </div>
                        <textarea id="message" name="message" rows="5" required placeholder="试试使用 **Markdown** 语法，支持代码块、列表等格式。" class="block w-full rounded-b-lg border border-t-0 border-input bg-background px-4 py-3 text-sm leading-6 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40" data-i18n-placeholder="textareaPlaceholder"></textarea>
                        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                            <div class="flex flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40 transition-all hover:border-ring/50">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-50"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
                                <input type="text" name="tags" placeholder="添加标签（用逗号或空格分隔）" class="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/80 focus:outline-none" data-i18n-placeholder="tagsPlaceholder">
                            </div>
                            <button type="submit" class="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground shadow transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                                <span data-i18n="submitButton">提交留言</span>
                            </button>
                        </div>
                    </form>
                </section>

                <section class="rounded-2xl border border-border bg-card/90 p-5 shadow-sm shadow-black/5 backdrop-blur-sm">
                    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <div class="flex flex-wrap items-center gap-2">
                            <h2 class="flex items-center gap-2 text-sm font-semibold">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                <span data-i18n="searchTitle">搜索留言</span>
                            </h2>
                            <span class="hidden text-xs text-muted-foreground sm:inline" data-i18n="searchSubtitle">支持模糊匹配并保留分页</span>
                        </div>
                        ${searchTerm ? `<span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                            <span data-i18n="searchFilter" data-term="${searchValueAttr}">已筛选：${searchValueHtml}</span>
                        </span>` : ''}
                    </div>
                    <form action="/" method="get" class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                        <div class="flex flex-1 items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm text-foreground shadow-sm transition-all focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40 hover:border-ring/50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-50"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                            <input type="search" name="q" value="${searchValueAttr}" placeholder="输入关键字" class="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/80 focus:outline-none" data-i18n-placeholder="searchPlaceholder">
                        </div>
                        <div class="flex items-center gap-2">
                            <button type="submit" class="inline-flex h-10 items-center justify-center rounded-md bg-secondary px-4 text-sm font-medium text-secondary-foreground shadow-sm transition hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-i18n="searchButton">搜索</button>
                            ${searchTerm ? `<a href="/" class="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition hover:bg-accent hover:text-accent-foreground" data-i18n="searchClear">清除</a>` : ''}
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

function renderToolbarButton(action, key, icon) {
    return `
        <button type="button" class="toolbar-btn inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-action="${action}" data-i18n-title="${key}" title="${key}">
            ${icon}
        </button>
    `;
}

module.exports = { renderHomePage };
