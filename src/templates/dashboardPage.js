const { escapeHtml } = require('../utils/format');
const { version, versionDate } = require('../../package.json');

/**
 * 验证颜色值是否安全（只允许十六进制颜色）
 */
function isValidColor(color) {
    return /^#[0-9A-Fa-f]{3,6}$/.test(color);
}

/**
 * 获取安全的颜色值
 */
function getSafeColor(color) {
    return isValidColor(color) ? color : '#3b82f6';
}

/**
 * 安全的 JSON 序列化（防止 script 标签注入）
 */
function safeJsonStringify(data) {
    return JSON.stringify(data)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e');
}

function renderDashboardPage(stats) {
    const {
        totalMessagesEver,
        currentMessageCount,
        currentReplyCount,
        avgMessageLength,
        tagRanking,
        hourlyDistribution,
        topMessages,
        dailyStats
    } = stats;

    // 准备图表数据
    const dailyLabels = safeJsonStringify(dailyStats.map(d => d.date.slice(5)));
    const dailyMessageData = safeJsonStringify(dailyStats.map(d => d.message_count));
    const dailyReplyData = safeJsonStringify(dailyStats.map(d => d.reply_count));
    const hourlyData = safeJsonStringify(hourlyDistribution);

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>数据看板 - 简易留言板</title>
    ${renderHeadScripts()}
</head>
<body class="min-h-screen bg-background text-foreground">
    <div class="relative isolate">
        ${renderGradientBackground()}
        <main class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
            <div class="flex flex-col gap-6">
                ${renderHeader()}
                ${renderSummaryCards(totalMessagesEver, currentMessageCount, currentReplyCount, avgMessageLength)}
                ${renderChartsSection(dailyLabels, dailyMessageData, dailyReplyData, hourlyData)}
                ${renderTagRanking(tagRanking)}
                ${renderTopMessages(topMessages)}
            </div>
        </main>
    </div>
    ${renderChartScripts(dailyLabels, dailyMessageData, dailyReplyData, hourlyData)}
</body>
</html>
    `;
}

function renderHeadScripts() {
    return `
    <script>
        (function() {
            try {
                const storedTheme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                }
            } catch (error) {}
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
                        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
                        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
                        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
                        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
                        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
                        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' }
                    },
                    borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
                    fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] }
                }
            }
        };
    </script>
    <style>
        :root {
            color-scheme: light;
            --background: 0 0% 100%; --foreground: 222.2 47.4% 11.2%;
            --muted: 210 40% 96.1%; --muted-foreground: 215.4 16.3% 46.9%;
            --border: 214.3 31.8% 91.4%; --input: 214.3 31.8% 91.4%;
            --card: 0 0% 100%; --card-foreground: 222.2 47.4% 11.2%;
            --primary: 221.2 83.2% 53.3%; --primary-foreground: 210 40% 98%;
            --secondary: 210 40% 96.1%; --secondary-foreground: 222.2 47.4% 11.2%;
            --accent: 210 40% 96.1%; --accent-foreground: 222.2 47.4% 11.2%;
            --destructive: 0 72.2% 50.6%; --destructive-foreground: 210 40% 98%;
            --ring: 221.2 83.2% 53.3%; --radius: 0.9rem;
        }
        .dark {
            color-scheme: dark;
            --background: 222.2 84% 4.9%; --foreground: 210 40% 98%;
            --muted: 217.2 32.6% 17.5%; --muted-foreground: 215 20.2% 65.1%;
            --border: 217.2 32.6% 17.5%; --input: 217.2 32.6% 17.5%;
            --card: 222.2 84% 4.9%; --card-foreground: 210 40% 98%;
            --primary: 217.2 91.2% 59.8%; --primary-foreground: 222.2 47.4% 11.2%;
            --secondary: 217.2 32.6% 17.5%; --secondary-foreground: 210 40% 98%;
            --accent: 217.2 32.6% 17.5%; --accent-foreground: 210 40% 98%;
            --destructive: 0 62.8% 45.6%; --destructive-foreground: 210 40% 98%;
            --ring: 224.3 76.3% 48%;
        }
    </style>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600|jetbrains-mono:400,500" rel="stylesheet" />
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    `;
}

function renderGradientBackground() {
    return `
    <div class="pointer-events-none absolute inset-x-0 top-[-14rem] -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
        <div class="relative left-1/2 aspect-[1108/632] w-[72rem] -translate-x-1/2 bg-gradient-to-tr from-indigo-300 via-sky-200 to-purple-200 opacity-60 dark:from-indigo-950 dark:via-slate-800 dark:to-purple-900"></div>
    </div>
    `;
}

function renderHeader() {
    return `
    <section class="flex flex-col gap-4 rounded-2xl border border-border bg-card/90 p-6 shadow-lg shadow-black/5 backdrop-blur">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="space-y-2">
                <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Analytics Dashboard</p>
                <h1 class="text-3xl font-semibold tracking-tight">
                    <span data-i18n="dashboardTitle">数据看板</span>
                    <span class="ml-2 text-base font-normal text-muted-foreground/60">v${version}</span>
                </h1>
                <p class="text-sm text-muted-foreground">留言板运营数据统计与分析</p>
            </div>
            <div class="flex items-center gap-3 self-end sm:self-auto">
                <a href="/" class="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-4 text-xs font-medium shadow-sm transition hover:bg-accent hover:text-accent-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    返回首页
                </a>
                <button type="button" id="theme-toggle" class="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition hover:bg-accent hover:text-accent-foreground">
                    <span aria-hidden="true">☀️</span>
                    <span class="theme-toggle-label">亮色</span>
                </button>
            </div>
        </div>
    </section>
    `;
}

function renderSummaryCards(totalMessagesEver, currentMessageCount, currentReplyCount, avgMessageLength) {
    return `
    <section class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        ${renderStatCard('历史总留言', totalMessagesEver, 'text-primary', `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        `)}
        ${renderStatCard('当前留言数', currentMessageCount, 'text-emerald-500', `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        `)}
        ${renderStatCard('总答复数', currentReplyCount, 'text-amber-500', `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
        `)}
        ${renderStatCard('平均字数', avgMessageLength, 'text-violet-500', `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
        `)}
    </section>
    `;
}

function renderStatCard(label, value, colorClass, icon) {
    return `
    <div class="rounded-xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur transition hover:shadow-md">
        <div class="flex items-center justify-between">
            <div class="rounded-lg bg-muted p-2 ${colorClass}">${icon}</div>
        </div>
        <div class="mt-4">
            <p class="text-2xl font-bold tracking-tight">${value.toLocaleString()}</p>
            <p class="text-xs text-muted-foreground mt-1">${label}</p>
        </div>
    </div>
    `;
}

function renderChartsSection(dailyLabels, dailyMessageData, dailyReplyData, hourlyData) {
    return `
    <section class="grid gap-6 lg:grid-cols-2">
        <div class="rounded-xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur">
            <h3 class="text-sm font-semibold mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>
                每日留言趋势（最近30天）
            </h3>
            <div class="h-64">
                <canvas id="dailyChart"></canvas>
            </div>
        </div>
        <div class="rounded-xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur">
            <h3 class="text-sm font-semibold mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                活跃时段分布（24小时）
            </h3>
            <div class="h-64">
                <canvas id="hourlyChart"></canvas>
            </div>
        </div>
    </section>
    `;
}

function renderTagRanking(tagRanking) {
    if (!tagRanking || tagRanking.length === 0) {
        return `
        <section class="rounded-xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur">
            <h3 class="text-sm font-semibold mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
                标签使用排行
            </h3>
            <p class="text-sm text-muted-foreground">暂无标签数据</p>
        </section>
        `;
    }

    const maxCount = Math.max(...tagRanking.map(t => t.usage_count), 1);
    const tagItems = tagRanking.map((tag, index) => {
        const percentage = (tag.usage_count / maxCount) * 100;
        const safeColor = getSafeColor(tag.color);
        return `
        <div class="flex items-center gap-3">
            <span class="w-6 text-xs text-muted-foreground text-right">${index + 1}</span>
            <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-medium flex items-center gap-1.5">
                        <span class="inline-block h-2 w-2 rounded-full" style="background-color: ${safeColor};"></span>
                        ${escapeHtml(tag.name)}
                    </span>
                    <span class="text-xs text-muted-foreground">${tag.usage_count} 次</span>
                </div>
                <div class="h-2 rounded-full bg-muted overflow-hidden">
                    <div class="h-full rounded-full transition-all" style="width: ${percentage}%; background-color: ${safeColor};"></div>
                </div>
            </div>
        </div>
        `;
    }).join('');

    return `
    <section class="rounded-xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur">
        <h3 class="text-sm font-semibold mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
            标签使用排行 TOP ${tagRanking.length}
        </h3>
        <div class="space-y-3">
            ${tagItems}
        </div>
    </section>
    `;
}

function renderTopMessages(topMessages) {
    if (!topMessages || topMessages.length === 0) {
        return `
        <section class="rounded-xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur">
            <h3 class="text-sm font-semibold mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
                热门留言
            </h3>
            <p class="text-sm text-muted-foreground">暂无热门留言</p>
        </section>
        `;
    }

    const messageItems = topMessages.map((msg, index) => {
        const preview = msg.content.length > 80 ? msg.content.slice(0, 80) + '...' : msg.content;
        return `
        <div class="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition">
            <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">${index + 1}</span>
            <div class="flex-1 min-w-0">
                <p class="text-sm text-foreground line-clamp-2">${escapeHtml(preview)}</p>
                <p class="text-xs text-muted-foreground mt-1">${msg.reply_count} 条答复</p>
            </div>
        </div>
        `;
    }).join('');

    return `
    <section class="rounded-xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur">
        <h3 class="text-sm font-semibold mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
            热门留言 TOP ${topMessages.length}
        </h3>
        <div class="space-y-2">
            ${messageItems}
        </div>
    </section>
    `;
}

function renderChartScripts(dailyLabels, dailyMessageData, dailyReplyData, hourlyData) {
    return `
    <script>
        // 主题切换
        const themeToggle = document.getElementById('theme-toggle');
        const root = document.documentElement;

        function updateThemeToggle() {
            const isDark = root.classList.contains('dark');
            const icon = themeToggle.querySelector('span[aria-hidden="true"]');
            const label = themeToggle.querySelector('.theme-toggle-label');
            if (icon) icon.textContent = isDark ? '🌙' : '☀️';
            if (label) label.textContent = isDark ? '暗色' : '亮色';
        }

        themeToggle?.addEventListener('click', () => {
            const isDark = root.classList.toggle('dark');
            try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch(e) {}
            updateThemeToggle();
            updateChartColors();
        });

        updateThemeToggle();

        // 图表颜色配置
        function getChartColors() {
            const isDark = root.classList.contains('dark');
            return {
                text: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                grid: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                primary: isDark ? 'rgba(96, 165, 250, 0.8)' : 'rgba(59, 130, 246, 0.8)',
                primaryBg: isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                secondary: isDark ? 'rgba(251, 191, 36, 0.8)' : 'rgba(245, 158, 11, 0.8)',
                secondaryBg: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(245, 158, 11, 0.2)'
            };
        }

        // 每日趋势图
        const dailyCtx = document.getElementById('dailyChart')?.getContext('2d');
        let dailyChart;
        if (dailyCtx) {
            const colors = getChartColors();
            dailyChart = new Chart(dailyCtx, {
                type: 'line',
                data: {
                    labels: ${dailyLabels},
                    datasets: [{
                        label: '留言数',
                        data: ${dailyMessageData},
                        borderColor: colors.primary,
                        backgroundColor: colors.primaryBg,
                        fill: true,
                        tension: 0.4
                    }, {
                        label: '答复数',
                        data: ${dailyReplyData},
                        borderColor: colors.secondary,
                        backgroundColor: colors.secondaryBg,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: colors.text } } },
                    scales: {
                        x: { ticks: { color: colors.text }, grid: { color: colors.grid } },
                        y: { ticks: { color: colors.text }, grid: { color: colors.grid }, beginAtZero: true }
                    }
                }
            });
        }

        // 时段分布图
        const hourlyCtx = document.getElementById('hourlyChart')?.getContext('2d');
        let hourlyChart;
        if (hourlyCtx) {
            const colors = getChartColors();
            const hourLabels = Array.from({length: 24}, (_, i) => i + ':00');
            hourlyChart = new Chart(hourlyCtx, {
                type: 'bar',
                data: {
                    labels: hourLabels,
                    datasets: [{
                        label: '留言数',
                        data: ${hourlyData},
                        backgroundColor: colors.primary,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: colors.text, maxRotation: 45 }, grid: { display: false } },
                        y: { ticks: { color: colors.text }, grid: { color: colors.grid }, beginAtZero: true }
                    }
                }
            });
        }

        // 更新图表颜色
        function updateChartColors() {
            const colors = getChartColors();
            if (dailyChart) {
                dailyChart.data.datasets[0].borderColor = colors.primary;
                dailyChart.data.datasets[0].backgroundColor = colors.primaryBg;
                dailyChart.data.datasets[1].borderColor = colors.secondary;
                dailyChart.data.datasets[1].backgroundColor = colors.secondaryBg;
                dailyChart.options.plugins.legend.labels.color = colors.text;
                dailyChart.options.scales.x.ticks.color = colors.text;
                dailyChart.options.scales.x.grid.color = colors.grid;
                dailyChart.options.scales.y.ticks.color = colors.text;
                dailyChart.options.scales.y.grid.color = colors.grid;
                dailyChart.update();
            }
            if (hourlyChart) {
                hourlyChart.data.datasets[0].backgroundColor = colors.primary;
                hourlyChart.options.scales.x.ticks.color = colors.text;
                hourlyChart.options.scales.y.ticks.color = colors.text;
                hourlyChart.options.scales.y.grid.color = colors.grid;
                hourlyChart.update();
            }
        }
    </script>
    `;
}

module.exports = { renderDashboardPage };
