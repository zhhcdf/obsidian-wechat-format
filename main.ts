// ========== Obsidian Imports ==========
const { Plugin, MarkdownRenderer, PluginSettingTab, Setting, App, Notice, ItemView, WorkspaceLeaf, MarkdownView, requestUrl, TFile, SuggestModal } = require('obsidian');
// ========== Types ==========

interface WeChatFormatSettings {
	theme: string;
	fontSize: string;
	lineHeight: string;
	imageWidth: string;
	addQrCode: boolean;
	qrCodeText: string;
	autoIndent: boolean;
		indentSize: number;
		// Custom Quote (引言)
		enableQuote: boolean;
		quoteText: string;
		quoteAuthor: string;
		quoteFontSize: string;
		// Bottom follow area (底部关注区)
		qrCodeFontSize: string;
		// Heading styles (标题样式)
		h2Style: string;
		h3Style: string;
		h4Style: string;
		// Code block border style (代码块边框样式)
		codeBorderStyle: string;
		// WeChat Official Account API credentials
	appId: string;
	appSecret: string;
	author: string;
	thumbMediaId: string;
}

interface Theme {
	name: string;
	label: string;
	description: string;
	colors: {
		primary: string;
		background: string;
		text: string;
		heading: string;
		accent: string;
		border: string;
		codeBg: string;
		codeText: string;
		quoteBg: string;
		quoteBorder: string;
		tableHeader: string;
		tableBorder: string;
		tableAlt: string;
	};
}

const DEFAULT_SETTINGS: WeChatFormatSettings = {
	theme: 'classic',
	fontSize: '16px',
	lineHeight: '1.75',
	imageWidth: '100%',
	addQrCode: false,
	qrCodeText: '扫码关注',
	autoIndent: false,
		indentSize: 2,
		enableQuote: false,
		quoteText: '',
		quoteAuthor: '',
		quoteFontSize: '16px',
		qrCodeFontSize: '16px',
		// Heading styles
		h2Style: 'border-left',
		h3Style: 'border-bottom',
		h4Style: 'border-bottom',
		// Code block border style
		codeBorderStyle: 'default',
		appId: '',
	appSecret: '',
	author: '',
	thumbMediaId: '',
};


// ========== Code Block Border Styles ==========

const CODE_BORDER_STYLES: { id: string; label: string }[] = [
	{ id: 'default', label: '默认（简洁底纹）' },
	{ id: 'apple', label: '苹果（圆点窗口）' },
	{ id: 'linux', label: 'Linux（终端风格）' },
	{ id: 'windows', label: 'Windows（VS Code 风格）' },
];

// ========== Theme Definitions ==========

const THEMES: Record<string, Theme> = {
	classic: {
		name: 'classic',
		label: '📰 经典商务',
		description: '正式、稳重的红黑配色，适合企业公众号',
		colors: {
			primary: '#c0392b', background: '#ffffff', text: '#333333',
			heading: '#c0392b', accent: '#e74c3c', border: '#e0e0e0',
			codeBg: '#d0d0d0', codeText: '#2c3e50',
			quoteBg: '#fef9f9', quoteBorder: '#c0392b',
			tableHeader: '#c0392b', tableBorder: '#e0e0e0', tableAlt: '#fdf2f2',
		},
	},
	modern: {
		name: 'modern',
		label: '🌿 清新现代',
		description: '蓝绿配色，简约清爽，适合科技/生活方式号',
		colors: {
			primary: '#2ecc71', background: '#ffffff', text: '#2c3e50',
			heading: '#27ae60', accent: '#1abc9c', border: '#d5f4e6',
			codeBg: '#c8e6c9', codeText: '#1a5276',
			quoteBg: '#f0faf4', quoteBorder: '#2ecc71',
			tableHeader: '#27ae60', tableBorder: '#d5f4e6', tableAlt: '#f0faf4',
		},
	},
	minimal: {
		name: 'minimal',
		label: '⚪ 极简留白',
		description: '大量留白，仅用灰色调，适合深度阅读内容',
		colors: {
			primary: '#666666', background: '#ffffff', text: '#444444',
			heading: '#222222', accent: '#888888', border: '#eeeeee',
			codeBg: '#cccccc', codeText: '#444444',
			quoteBg: '#fafafa', quoteBorder: '#999999',
			tableHeader: '#555555', tableBorder: '#eeeeee', tableAlt: '#fafafa',
		},
	},
	warm: {
		name: 'warm',
		label: '☕ 温暖文艺',
		description: '暖橙棕色调，适合文学/情感/生活类文章',
		colors: {
			primary: '#e67e22', background: '#fefcf7', text: '#5d4037',
			heading: '#d35400', accent: '#f39c12', border: '#f0e6d3',
			codeBg: '#f5e6d0', codeText: '#5d4037',
			quoteBg: '#fef9ef', quoteBorder: '#e67e22',
			tableHeader: '#d35400', tableBorder: '#f0e6d3', tableAlt: '#fef9ef',
		},
	},
	tech: {
		name: 'tech',
		label: '💻 极客科技',
		description: '深色代码块、蓝色主题，适合技术/编程文章',
		colors: {
			primary: '#3498db', background: '#ffffff', text: '#2c3e50',
			heading: '#2980b9', accent: '#3498db', border: '#d6eaf8',
			codeBg: '#1e1e2e', codeText: '#cdd6f4',
			quoteBg: '#eaf2f8', quoteBorder: '#3498db',
			tableHeader: '#2980b9', tableBorder: '#d6eaf8', tableAlt: '#eaf2f8',
		},
	},
	nord: {
		name: 'nord',
		label: '🏔️ Nord 北欧',
		description: '北欧极简配色，柔和舒适，适合各类内容',
		colors: {
			primary: '#5e81ac', background: '#ffffff', text: '#4c566a',
			heading: '#2e3440', accent: '#88c0d0', border: '#e5e9f0',
			codeBg: '#d8dee9', codeText: '#4c566a',
			quoteBg: '#f0f4f8', quoteBorder: '#5e81ac',
			tableHeader: '#5e81ac', tableBorder: '#e5e9f0', tableAlt: '#f0f4f8',
		},
	},
};

// ========== Heading Style Definitions ==========

interface HeadingStyleDef {
	id: string;
	label: string;
	css: (c: Theme['colors']) => string[];
	prependHtml?: (c: Theme['colors']) => string;
}

const H2_STYLES: HeadingStyleDef[] = [
	{
		id: 'border-left',
		label: '左边框',
		css: (c) => [
			`border-left:4px solid ${c.primary}`,
			`padding-left:12px`,
		],
	},
	{
		id: 'bottom-line',
		label: '底部分隔线',
		css: (c) => [
			`border-bottom:3px solid ${c.primary}`,
			`padding-bottom:8px`,
		],
	},
	{
		id: 'bg-block',
		label: '背景色块',
		css: (c) => [
			`background:${c.primary}40`,
			`padding:12px 16px`,
			`border-radius:4px`,
			`text-align:center`,
		],
	},
	{
		id: 'double-line',
		label: '双线装饰',
		css: (c) => [
			`text-align:center`,
			`border-top:2px solid ${c.primary}`,
			`border-bottom:2px solid ${c.primary}`,
			`padding:10px 0`,
		],
	},
	{
		id: 'left-border-grad',
		label: '左边框渐变',
		css: (c) => [
			`border-left:4px solid ${c.primary}`,
			`padding:6px 0 6px 14px`,
			`background:linear-gradient(to right, ${c.primary}50, ${c.primary}08)`,
			`border-radius:0 4px 4px 0`,
		],
	},
	{
		id: 'icon-number',
		label: '序号图标',
		css: (c) => [
			`display:flex`,
			`align-items:center`,
			`gap:12px`,
		],
		prependHtml: (c) => `<span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:${c.primary};color:#fff;font-size:14px;font-weight:700;flex-shrink:0;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 12 13 20 7"></polyline><polyline points="4 13 12 19 20 13"></polyline></svg></span>`,
	},
];

const H3_STYLES: HeadingStyleDef[] = [
	{
		id: 'border-bottom',
		label: '底部分隔线',
		css: (c) => [
			`border-bottom:2px solid ${c.border}`,
			`padding-bottom:6px`,
		],
	},
	{
		id: 'border-left',
		label: '左边框（细）',
		css: (c) => [
			`border-left:3px solid ${c.primary}`,
			`padding-left:10px`,
		],
	},
	{
		id: 'label',
		label: '圆角标签',
		css: (c) => [
			`background:${c.primary}`,
			`color:#ffffff`,
			`padding:4px 14px`,
			`border-radius:4px`,
			`display:inline-block`,
		],
	},
	{
		id: 'underline',
		label: '下划线装饰',
		css: (c) => [
			`display:inline-block`,
			`border-bottom:2px solid ${c.primary}`,
			`padding-bottom:2px`,
		],
	},
];

const H4_STYLES: HeadingStyleDef[] = [
	{
		id: 'border-bottom',
		label: '底部分隔线',
		css: (c) => [
			`border-bottom:1px solid ${c.border}`,
			`padding-bottom:4px`,
		],
	},
	{
		id: 'bold',
		label: '纯色加粗',
		css: (c) => [
			`color:${c.primary}`,
		],
	},
	{
		id: 'dot',
		label: '左侧方点',
		css: (c) => [
			`display:flex`,
			`align-items:center`,
			`gap:8px`,
		],
		prependHtml: (c) => `<span style="display:inline-flex;align-items:center;flex-shrink:0;"><svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="8" height="8" rx="0" ry="0" fill="${c.primary}"/></svg></span>`,
	},
	{
		id: 'label',
		label: '圆角标签',
		css: (c) => [
			`background:${c.primary}40`,
			`color:${c.primary}`,
			`padding:2px 10px`,
			`border-radius:4px`,
			`display:inline-block`,
		],
	},
];

const HEADING_STYLE_MAP: Record<string, HeadingStyleDef[]> = {
	h2: H2_STYLES,
	h3: H3_STYLES,
	h4: H4_STYLES,
};

function getHeadingStyleDef(tag: string, settings: WeChatFormatSettings): HeadingStyleDef | null {
	const styles = HEADING_STYLE_MAP[tag as keyof typeof HEADING_STYLE_MAP];
	if (!styles) return null;
	const key = tag === 'h2' ? settings.h2Style
		: tag === 'h3' ? settings.h3Style
		: settings.h4Style;
	return styles.find(s => s.id === key) || null;
}

// ========== DOM-based HTML to WeChat Converter ==========

/**
 * Convert Obsidian-rendered HTML to WeChat-compatible HTML with inline styles.
 * Uses DOM tree traversal instead of regex to handle nested structures correctly.
 */
function convertToWeChatHTML(html: string, settings: WeChatFormatSettings): string {
	const theme = THEMES[settings.theme] || THEMES.classic;
	const c = theme.colors;

	// Parse into DOM
	const parser = new DOMParser();
	const doc = parser.parseFromString(
		`<div class="wechat-root">${html}</div>`,
		'text/html'
	);
	const root = doc.body.firstElementChild as HTMLElement;
	if (!root) return html;

	// Pre-compute <li> indices for ordered lists (before any DOM modifications)
	const allOls = root.querySelectorAll('ol');
	for (const ol of allOls) {
		const startNum = parseInt(ol.getAttribute('start') || '1', 10);
		const liItems = Array.from(ol.children).filter(c => c.tagName === 'LI');
		liItems.forEach((li, idx) => {
			li.setAttribute('data-li-index', String(startNum + idx));
		});
	}

	// Walk the DOM tree and apply inline styles
	applyStyles(root, c, settings, doc);

	// Build outer container
	const containerStyle = [
		`max-width:677px`,
		`margin:0 auto`,
		`padding:10px 15px`,
		`background:${c.background}`,
		`font-family:-apple-system,'Helvetica Neue','PingFang SC','Microsoft YaHei',sans-serif`,
		`font-size:${settings.fontSize}`,
		`line-height:${settings.lineHeight}`,
		`color:${c.text}`,
	].join(';');

	// Serialize inner HTML
	let result = root.innerHTML;

	// Remove empty paragraphs (no extra <br> — WeChat editor adds its own spacing)
	result = result.replace(/<p[^>]*>\s*(?:<br\s*\/?>)?\s*<\/p>/gi, '');

	// Wrap in section
	result = `<section style="${containerStyle}">\n${result}\n</section>`;

	// Append QR code if enabled
	if (settings.addQrCode) {
		result += `\n<section style="max-width:677px;margin:20px auto 0;padding:20px 15px;text-align:center;background:${c.background};border-top:1px solid ${c.border};font-family:-apple-system,'Helvetica Neue','PingFang SC','Microsoft YaHei',sans-serif;font-size:14px;color:#999;">
			<p style="margin:0;font-weight:700;font-size:${settings.qrCodeFontSize};">${settings.qrCodeText || '扫码关注'}</p>\n			<p style="margin:0;font-size:14px;">&nbsp;</p>\n		</section>`;
	}

	return result;
}

/** Darken a hex color by a given amount */
function darkenHex(hex: string, amount: number): string {
	const num = parseInt(hex.replace('#', ''), 16);
	const r = Math.max(0, (num >> 16) - amount);
	const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
	const b = Math.max(0, (num & 0x0000FF) - amount);
	return `rgb(${r},${g},${b})`;
}

function applyStyles(el: HTMLElement, c: Theme['colors'], settings: WeChatFormatSettings, doc: Document): void {
	// Process children first (depth-first traversal)
	for (let i = 0; i < el.children.length; i++) {
		applyStyles(el.children[i] as HTMLElement, c, settings, doc);
	}

	const tag = el.tagName.toLowerCase();

	switch (tag) {
		case 'h1':
			setStyle(el, headingStyle(c, tag));
			break;
		case 'h2':
		case 'h3':
		case 'h4': {
			const styleDef = getHeadingStyleDef(tag, settings);
			const extraCss = styleDef ? styleDef.css(c) : undefined;
			// Label style: keep h4 as block, wrap content in a span with inline-block
			if (tag === 'h4' && styleDef?.id === 'label') {
				// Use default heading style for h4 (block), wrap content in a <span> for the label
				setStyle(el, headingStyle(c, tag));
				const span = doc.createElement('span');
				span.textContent = el.textContent;
				setStyle(span, extraCss || []);
				el.textContent = '';
				el.appendChild(span);
			} else {
				setStyle(el, headingStyle(c, tag, extraCss));
				if (styleDef?.prependHtml) {
					const span = doc.createElement('span');
					span.innerHTML = styleDef.prependHtml(c);
					el.insertBefore(span, el.firstChild);
				}
			}
			break;
		}
		case 'h5':
		case 'h6':
			setStyle(el, headingStyle(c, tag));
			break;

		case 'p':
			setStyle(el, paragraphStyle(c, settings));
			break;

		case 'blockquote':
			setStyle(el, [
				`margin:1em 0`,
				`padding:12px 16px`,
				`background:${c.quoteBg}`,
				`border-left:4px solid ${c.quoteBorder}`,
				`border-radius:0 4px 4px 0`,
				`color:${c.text}`,
			]);
			break;

		case 'pre': {
			// Code block: wrapper <div> with background, each line as <p> also with background.
			// WeChat API may strip <div> styles but preserves <p> inline styles. Wrapper
			// provides continuous background in preview; <p> backgrounds ensure WeChat
			// editor also shows the code block background.
			const codeText = el.textContent || '';
			const lines = codeText.split('\n');

			// Extract code language from <code> child element's class
			const codeEl = el.querySelector('code');
			let lang = '';
			if (codeEl) {
				const cls = codeEl.className || '';
				const langMatch = cls.match(/language-(\w+)/);
				if (langMatch) lang = langMatch[1];
			}

			// Wrapper <div> with background
			const wrapper = doc.createElement('div');
			const borderStyle = settings.codeBorderStyle || 'default';
			const wrapperStyles = [
				`background: ${c.codeBg}`,
				`color: ${c.codeText}`,
				`border-radius: 4px`,
				`overflow: hidden`,
				`margin: 1.5em 0`,
			];
			if (borderStyle === 'apple' || borderStyle === 'linux' || borderStyle === 'windows') {
				wrapperStyles.push(`border: 1px solid ${c.border}`);
			}
			if (borderStyle === 'apple') {
				wrapperStyles.push(`box-shadow: 0 2px 8px rgba(0,0,0,0.08)`);
			}
			setStyle(wrapper, wrapperStyles);

			// Language label at top of wrapper — plus Apple dots or Linux title bar if selected
			if (borderStyle === 'apple') {
				// Apple-style: 3 colored dots using Unicode circles with color (WeChat safe)
				// Dots and language label in the same row — float: right for language
				const dotRow = doc.createElement('p');
				setStyle(dotRow, [
					`padding: 8px 12px 0 12px`,
					`margin: 0`,
					`background-color: ${c.codeBg}`,
					`margin-bottom: 0`,
				]);
				for (const dotColor of ['#ff5f57', '#febc2e', '#28c840']) {
					const dot = doc.createElement('span');
					dot.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="6" r="5" fill="${dotColor}"/></svg>`;
					setStyle(dot, [
						`display: inline-flex`,
						`vertical-align: middle`,
						`margin-right: 6px`,
					]);
					dotRow.appendChild(dot);
				}
				// Language label on the right in the same row
				if (lang) {
					const langSpan = doc.createElement('span');
					langSpan.textContent = lang;
					setStyle(langSpan, [
						`float: right`,
						`font-family:'Courier New','Consolas',monospace`,
						`font-size:0.75em`,
						`color: ${c.codeText}`,
					]);
					dotRow.appendChild(langSpan);
				}
				wrapper.appendChild(dotRow);
			} else if (borderStyle === 'linux') {
				// Linux terminal style: title bar with colored square buttons using Unicode + color (WeChat safe)
				const titleBar = doc.createElement('p');
				setStyle(titleBar, [
					`padding: 6px 12px`,
					`margin: 0`,
					`background-color: ${c.primary}`,
					`color: #ffffff`,
					`font-size: 0.75em`,
					`font-family:'Courier New','Consolas',monospace`,
				]);
				for (const btnColor of ['#ff5f57', '#febc2e', '#28c840']) {
					const btn = doc.createElement('span');
					btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="10" height="10" rx="2" ry="2" fill="${btnColor}"/></svg>`;
					setStyle(btn, [
						`display: inline-flex`,
						`vertical-align: middle`,
						`margin-right: 6px`,
					]);
					titleBar.appendChild(btn);
				}
				// Language label on the right
				if (lang) {
					const langSpan = doc.createElement('span');
					langSpan.textContent = lang;
					setStyle(langSpan, [
						`float: right`,
						`opacity: 0.8`,
					]);
					titleBar.appendChild(langSpan);
				}
				wrapper.appendChild(titleBar);
			} else if (borderStyle === 'windows') {
				// Windows VS Code style: accent bar (colored p) + language label on the right
				// Accent bar: p with background color + padding (WeChat-safe — background on p is preserved)
				const accentBar = doc.createElement('p');
				accentBar.textContent = '\u00A0';  // non-breaking space
				setStyle(accentBar, [
					`background-color: ${c.primary}`,
					`padding: 2px 0`,
					`margin: 0`,
					`font-size: 1px`,
					`line-height: 1`,
					`color: transparent`,
				]);
				wrapper.appendChild(accentBar);
				if (lang) {
					const langRow = doc.createElement('p');
					langRow.textContent = lang;
					setStyle(langRow, [
						`padding: 4px 12px 0 12px`,
						`margin: 0`,
						`background-color: ${c.codeBg}`,
						`text-align: right`,
						`color: ${c.codeText}`,
						`font-family:'Courier New','Consolas',monospace`,
						`font-size:0.75em`,
						`line-height: 1.5`,
					]);
					wrapper.appendChild(langRow);
				}
			} else if (lang) {
				// Default style: simple language label at top
				const langP = doc.createElement('p');
				langP.textContent = lang;
				setStyle(langP, [
					`background-color: ${c.codeBg}`,
					`color: ${c.codeText}`,
					`margin: 0`,
					`padding: 12px 16px 4px 16px`,
					`font-family:'Courier New','Consolas',monospace`,
					`font-size:0.75em`,
					`line-height: 1.5`,
					`border-radius: 4px 4px 0 0`,
					`text-align: right`,
				]);
				wrapper.appendChild(langP);
			}

			// Each line of code as a <p> — with background for WeChat editor fallback
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				const lineP = doc.createElement('p');
				// Use non-breaking space for empty lines so they retain height
				lineP.textContent = line || '\u00A0';
				const baseStyles = [
					`background: ${c.codeBg}`,
					`color: ${c.codeText}`,
					`margin: 0`,
					`padding: 0 16px`,
					`font-family:'Courier New','Consolas',monospace`,
					`font-size:0.9em`,
					`line-height: 1.5`,
					`word-break: break-all`,
				];

				// First code line with no language label: add top padding + top border-radius
				if (i === 0 && !lang) {
					baseStyles[3] = `padding: 12px 16px 0 16px`;
					baseStyles.push(`border-radius: 4px 4px 0 0`);
				}
				// Last code line: add bottom padding + bottom border-radius
				if (i === lines.length - 1) {
					if (lang) {
						baseStyles[3] = `padding: 0 16px 12px 16px`;
					} else {
						baseStyles[3] = `padding: 12px 16px`;
					}
					if (i === 0) {
						baseStyles.push(`border-radius: 4px`);
					} else {
						baseStyles.push(`border-radius: 0 0 4px 4px`);
					}
				}
				// Single line: equal padding and full border-radius
				if (i === 0 && i === lines.length - 1) {
					baseStyles[3] = `padding: 12px 16px`;
					baseStyles.push(`border-radius: 4px`);
				}

				setStyle(lineP, baseStyles);
				wrapper.appendChild(lineP);
			}
		el.parentNode?.replaceChild(wrapper, el);
			break;
		}

		case 'code':
			if (el.parentElement?.tagName !== 'PRE') {
				setStyle(el, [
					`font-family:'Courier New','Consolas',monospace`,
					`background:${c.codeBg}`,
					`color:${c.codeText}`,
					`padding:2px 6px`,
					`border-radius:3px`,
					`font-size:0.9em`,
				]);
			}
			break;

		case 'table': {
			// Wrap in scrollable container
			const wrapper = doc.createElement('div');
			setStyle(wrapper, [`overflow-x:auto`, `margin:1em 0`]);
			el.parentNode?.insertBefore(wrapper, el);
			wrapper.appendChild(el);

			setStyle(el, [
				`width:100%`,
				`border-collapse:collapse`,
				`font-size:0.95em`,
				`border:1px solid ${c.tableBorder}`,
			]);

			// Process cells
			const ths = el.querySelectorAll('th');
			ths.forEach(th => setStyle(th, [
				`background:${c.tableHeader}`,
				`color:#ffffff`,
				`padding:10px 12px`,
				`font-weight:600`,
				`border:1px solid ${c.tableBorder}`,
				`text-align:left`,
			]));

			const tds = el.querySelectorAll('td');
			tds.forEach(td => setStyle(td, [
				`padding:8px 12px`,
				`border:1px solid ${c.tableBorder}`,
				`text-align:left`,
			]));

			// Alternating row colors
			const rows = el.querySelectorAll('tr');
			rows.forEach((row, idx) => {
				if (idx % 2 === 1) {
					row.querySelectorAll('td').forEach(td => {
						setStyle(td, [`background:${c.tableAlt}`]);
					});
				}
			});
			break;
		}

		case 'ul':
			setStyle(el, [`padding:0`, `margin:0.8em 0`, `list-style:none`]);
			break;

		case 'ol':
			setStyle(el, [`padding:0`, `margin:0.8em 0`, `list-style:none`]);
			break;

		case 'li': {
			const parent = el.parentElement;
			const isOrdered = parent?.tagName === 'OL';
			let depth = 0;
			let p = el.parentElement;
			while (p) {
				if (p.tagName === 'UL' || p.tagName === 'OL') depth++;
				p = p.parentElement;
			}

			// Build marker text
			let marker: string;
			if (isOrdered) {
				// Use pre-computed data-li-index (avoids live collection bugs)
				marker = `${el.getAttribute('data-li-index') || '1'}.`;
			} else {
				marker = '•';
				if (depth > 1) marker = '◦';
				if (depth > 2) marker = '▪';
			}

			const markerEl = doc.createElement('span');
			markerEl.textContent = marker;
			setStyle(markerEl, [
				`display:inline-block`,
				`padding-right:0.5em`,
				`color:${c.primary}`,
				`font-weight:${isOrdered ? '600' : 'normal'}`,
			]);

			// Flatten <p> inside <li> so marker + text are inline siblings
			const pChild = el.querySelector(':scope > p');
			if (pChild) {
				while (pChild.firstChild) {
					el.insertBefore(pChild.firstChild, pChild);
				}
				el.removeChild(pChild);
			}

			el.insertBefore(markerEl, el.firstChild);

			// Replace <li> with <p> so WeChat draft editor doesn't re-wrap content
			const pEl = doc.createElement('p');
			while (el.firstChild) {
				pEl.appendChild(el.firstChild);
			}
			setStyle(pEl, [
				`margin:0`,
				`padding-left:${(depth - 1) * 1.5}em`,
			]);
			el.parentNode?.replaceChild(pEl, el);
			break;
		}

		case 'hr':
			setStyle(el, [
				`border:none`,
				`border-top:1px dashed ${c.border}`,
				`margin:1.5em 0`,
			]);
			break;

		case 'img': {
			const src = el.getAttribute('src') || '';
			const alt = el.getAttribute('alt') || '';
			const width = settings.imageWidth;

			// Wrap in container
			const container = doc.createElement('div');
			setStyle(container, [`text-align:center`, `margin:1em 0`]);
			el.parentNode?.insertBefore(container, el);
			container.appendChild(el);

			setStyle(el, [
				`max-width:${width}`,
				`height:auto`,
				`border-radius:4px`,
			]);

			// Add caption
			if (alt) {
				const caption = doc.createElement('br');
				container.appendChild(caption);
				const capSpan = doc.createElement('span');
				capSpan.textContent = alt;
				setStyle(capSpan, [`color:#999`, `font-size:0.85em`]);
				container.appendChild(capSpan);
			}
			break;
		}

		case 'strong':
			setStyle(el, [`font-weight:700`, `color:${c.heading}`]);
			break;

		case 'a':
			setStyle(el, [`color:${c.primary}`, `text-decoration:none`]);
			break;
	}
}

function setStyle(el: HTMLElement, styles: string[]): void {
	if (!el || !styles.length) return;
	const existing = el.getAttribute('style') || '';
	const addon = styles.join(';');
	el.setAttribute('style', existing ? existing + ';' + addon : addon);
}

/** Escape special regex characters in a string for use in RegExp constructor */
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function headingStyle(c: Theme['colors'], tag: string, extraCss?: string[]): string[] {
	const sizes: Record<string, string> = {
		h1: '1.6em', h2: '1.35em', h3: '1.2em',
		h4: '1.1em', h5: '1em', h6: '0.95em',
	};
	const size = sizes[tag] || '1.2em';
	const styles: string[] = [
		`margin:1.2em 0 0.6em 0`,
		`font-size:${size}`,
		`font-weight:700`,
		`color:${c.heading}`,
		`line-height:1.4`,
	];
	if (extraCss) {
		// Use the explicit style definition (for H2/H3/H4 with user-selected styles)
		styles.push(...extraCss);
	} else {
		// Default decoration based on heading level
		if (tag === 'h1' || tag === 'h2') {
			styles.push(`border-left:4px solid ${c.primary}`);
			styles.push(`padding-left:12px`);
		} else {
			styles.push(`border-bottom:2px solid ${c.border}`);
			styles.push(`padding-bottom:6px`);
		}
	}
	return styles;
}

function paragraphStyle(c: Theme['colors'], settings: WeChatFormatSettings): string[] {
	const styles: string[] = [
		`margin:0`,
		`margin-bottom:1em`,
	];
	if (settings.autoIndent) {
		styles.push(`text-indent:${settings.indentSize}em`);
	}
	return styles;
}

// ========== WeChat Official Account API ==========

interface DraftResponse {
	errcode: number;
	errmsg: string;
	media_id?: string;
}

interface TokenResponse {
	access_token?: string;
	expires_in?: number;
	errcode?: number;
	errmsg?: string;
}
class WeChatApi {
	private appId: string;
	private appSecret: string;
	private thumbMediaId: string;
	private accessToken: string | null = null;
	private tokenExpiry: number = 0;

	constructor(appId: string, appSecret: string, thumbMediaId: string = '') {
		this.appId = appId;
		this.appSecret = appSecret;
		this.thumbMediaId = thumbMediaId;
	}

	updateCredentials(appId: string, appSecret: string, thumbMediaId: string = '') {
		this.appId = appId;
		this.appSecret = appSecret;
		this.thumbMediaId = thumbMediaId;
		this.accessToken = null;
		this.tokenExpiry = 0;
	}

	isConfigured(): boolean {
		return this.appId.length > 0 && this.appSecret.length > 0;
	}

	private async ensureToken(): Promise<string> {
		const now = Date.now();
		if (this.accessToken && now < this.tokenExpiry) {
			return this.accessToken;
		}

		const url = `https://api.weixin.qq.com/cgi-bin/token`
			+ `?grant_type=client_credential`
			+ `&appid=${encodeURIComponent(this.appId)}`
			+ `&secret=${encodeURIComponent(this.appSecret)}`;

		const resp = await requestUrl({ url });
		const data = resp.json;
		if (data.errcode || !data.access_token) {
			throw new Error(`获取 access_token 失败: ${data.errmsg || '未知错误'} (code: ${data.errcode})`);
		}
		this.accessToken = data.access_token;
		this.tokenExpiry = now + ((data.expires_in || 7200) - 300) * 1000;
		return this.accessToken;
	}

	/**
	 * Upload a default cover image (900×500 gray PNG) to WeChat material library.
	 * Returns the media_id on success. Does NOT cache — caller should persist it.
	 */
	async uploadDefaultThumbnail(): Promise<string> {
		const token = await this.ensureToken();
		const canvas = document.createElement('canvas');
		canvas.width = 900;
		canvas.height = 500;
		const ctx = canvas.getContext('2d')!;
		ctx.fillStyle = '#888888';
		ctx.fillRect(0, 0, 900, 500);
		const blob = await new Promise<Blob>((resolve, reject) => {
			canvas.toBlob((b) => {
				if (b) resolve(b);
				else reject(new Error('Failed to create PNG from canvas'));
			}, 'image/png');
		});
		const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${encodeURIComponent(token)}&type=image`;
		const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2, 12);
		const headerStr = `--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="thumb.png"\r\nContent-Type: image/png\r\n\r\n`;
		const footerStr = `\r\n--${boundary}--\r\n`;
		const headerBlob = new Blob([headerStr]);
		const footerBlob = new Blob([footerStr]);
		const fullBodyBlob = new Blob([headerBlob, blob, footerBlob]);
		const bodyBuffer = await fullBodyBlob.arrayBuffer();
		const resp = await requestUrl({
			url,
			method: 'POST',
			contentType: `multipart/form-data; boundary=${boundary}`,
			body: bodyBuffer,
		});
		const data = resp.json;
		if (data.errcode) {
			throw new Error(`上传封面失败: ${data.errmsg} (code: ${data.errcode})`);
		}
		this.thumbMediaId = data.media_id;
		return data.media_id;
	}

	/**
	 * Strip emoji and WeChat-rejected Unicode from HTML content
	 * to avoid "invalid content hint" (code: 45166) on draft add.
	 */
	private stripEmoji(str: string): string {
		// Comprehensive emoji stripping using Unicode property escapes
		return str
			.replace(/\p{Extended_Pictographic}/gu, '')  // ALL emoji characters
			.replace(/[\uFE00-\uFE0F]/g, '')              // Variation selectors
			.replace(/\u200D/g, '')                        // ZWJ (zero-width joiner)
			.replace(/\u20E3/g, '')                        // Keycap combining
			.replace(/\p{Emoji_Modifier}/gu, '')           // Skin tone modifiers
			.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')       // Regional indicators (flags)
			.replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '')       // Emoji modifier Fitzpatrick
			.replace(/\p{Default_Ignorable_Code_Point}/gu, '') // Invisible formatting chars
			.replace(/\s{2,}/g, ' ')
			.trim();
	}

	/**
	 * Lightweight sanitization for title/digest plain text.
	 * Only strips emoji and control characters — does NOT apply the aggressive
	 * cleanup (step 7) that is only needed for HTML content.
	 */
	private sanitizeTitle(str: string): string {
		let result = this.stripEmoji(str);
		// Strip control characters (except \n and 	)
		result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u200B-\u200F\u2028-\u202F\uFEFF]/g, '');
		// Collapse multiple spaces
		result = result.replace(/\s{3,}/g, ' ').trim();
		// Ensure non-empty
		if (result.length === 0) {
			result = '无标题';
		}
		return result;
	}

	/**
	 * Comprehensive content sanitization for WeChat draft API.
	 *   - Emoji/special Unicode
	 *   - app:// / file:// URLs remaining after failed image uploads
	 *   - Forbidden HTML tags (script, iframe, object, embed, applet, frame, frameset)
	 *   - Control characters (except \n)
	 *   - Content exceeding 20,000 character limit
	 *   - Empty content after stripping
	 */
	private sanitizeForWeChat(str: string): string {
		// 1. Strip emoji
		let result = this.stripEmoji(str);
		// 2. Replace app:// and file:// img tags with text placeholder (broken local references)
		result = result.replace(/<img[^>]*src\s*=\s*["']app:\/\/[^"']*["'][^>]*>/gi, '<span style="color:#999;font-size:0.9em;">[图片上传失败]</span>');
		result = result.replace(/<img[^>]*src\s*=\s*["']file:\/\/\/[^"']*["'][^>]*>/gi, '<span style="color:#999;font-size:0.9em;">[图片上传失败]</span>');
		// 3. Strip forbidden HTML tags (strip content + tag)
		result = result.replace(/<\/?(?:script|iframe|object|embed|applet|frame|frameset|form|input|button|select|textarea|style|link|meta|html|head|body|title|base|noscript|template)[^>]*>/gi, '');
		// 3b. Strip JS event handler attributes
		result = result.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*')/gi, '');
		// 3c. Strip javascript: URLs
		result = result.replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, 'href=""');
		// 4. Strip control characters except \n and 	, plus invisible Unicode
		result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u200B-\u200F\u2028-\u202F\uFEFF\u00A0]/g, '');
		// 5. Strip HTML comments
		result = result.replace(/<!--[\s\S]*?-->/g, '');
		// 6. Strip very long base64 data URLs
		result = result.replace(/src="data:image\/[^"]{500,}"/gi, 'src=""');
		// 7. Aggressive cleanup: strip all non-ASCII except CJK, HTML tags, CSS chars, and common punctuation.
		// This is the last-resort sanitizer to overcome code 45166. CSS values are ASCII (letters, digits,
		// #, ;, :, (, ), -, etc.) so they are preserved — only emoji, symbols, and exotic Unicode are removed.
		result = result.replace(
			/[^\x20-\x7E\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3000-\u303F\uFF00-\uFFEF\u2000-\u206F\u2100-\u214F\n\r	]/g,
			''
		).replace(/\n{3,}/g, '\n\n').trim();
		// 8. Truncate to 200000 chars (WeChat limit for draft content is ~64KB; generous margin)
		if (result.length > 200000) {
			result = result.substring(0, 199997) + '...';
		}
		// 9. Ensure minimum content
		if (result.trim().length === 0) {
			result = '<p></p>';
		}
		return result;
	}

	/**
	 * Upload an image (from article content) to WeChat permanent material library.
	 * @param imageData - Raw image binary as ArrayBuffer
	 * @param filename - Filename for the upload
	 * @param mimeType - MIME type (default image/jpeg)
	 * @returns {url: permanent WeChat CDN URL for use in article body, media_id: material ID}
	 */
	async uploadImage(
		imageData: ArrayBuffer,
		filename: string = 'image.jpg',
		mimeType: string = 'image/jpeg'
	): Promise<{ url: string; media_id: string }> {
		const token = await this.ensureToken();
		const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${encodeURIComponent(token)}&type=image`;
		const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2, 12);
		const headerStr = `--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
		const footerStr = `\r\n--${boundary}--\r\n`;
		const headerBlob = new Blob([headerStr]);
		const bodyBlob = new Blob([imageData]);
		const footerBlob = new Blob([footerStr]);
		const fullBodyBlob = new Blob([headerBlob, bodyBlob, footerBlob]);
		const bodyBuffer = await fullBodyBlob.arrayBuffer();
		const resp = await requestUrl({
			url,
			method: 'POST',
			contentType: `multipart/form-data; boundary=${boundary}`,
			body: bodyBuffer,
		});
		const data = resp.json;
		if (data.errcode) {
			throw new Error(`上传图片失败: ${data.errmsg} (code: ${data.errcode})`);
		}
		return { url: data.url, media_id: data.media_id };
	}

	async createDraft(
		title: string,
		content: string,
		author: string,
		digest: string
	): Promise<DraftResponse> {
		const token = await this.ensureToken();
		if (!this.thumbMediaId) {
			throw new Error(
				'缺少封面图片 MediaID。\n'
				+ '请先在公众号后台「素材库」上传封面图，将得到的 media_id 填入插件设置「封面图片 MediaID」。\n'
				+ '也可在插件设置中点击「上传默认封面」自动生成并保存。'
			);
		}
		// Lightweight sanitization for title/digest (emoji + control chars only)
		const safeTitle = this.sanitizeTitle(title);
		const safeDigest = this.sanitizeTitle(digest);
		// Full sanitization for HTML content (includes aggressive cleanup for code 45166)
		let safeContent = this.sanitizeForWeChat(content);
		// Note: aggressiveCleanContent was removed because it was stripping
		// inline CSS styles and Unicode content. sanitizeForWeChat (which includes
		// emoji removal) is sufficient to prevent code 45166.

		// Debug log — write sanitized content to a vault file for troubleshooting
		try {
			const app = (globalThis as any).app;
			if (app?.vault) {
				const debugPath = `.obsidian/plugins/obsidian-wechat-format/debug-payload.json`;
				await app.vault.adapter.write(debugPath, JSON.stringify({
					titleLen: safeTitle.length,
					contentLen: safeContent.length,
					digestLen: safeDigest.length,
					thumbMediaId: this.thumbMediaId?.substring(0, 8) + '...',
					titlePreview: safeTitle.substring(0, 60),
					contentPreview: safeContent.substring(0, 200),
					nonAsciiInContent: [...safeContent].filter(c => c.codePointAt(0)! > 127).join(''),
				}, null, 2));
			}
		} catch (_) {}
		console.log('[WeChat Format] createDraft payload:', {
			titleLen: safeTitle.length,
			contentLen: safeContent.length,
			digestLen: safeDigest.length,
			titlePreview: safeTitle.substring(0, 60),
			contentPreview: safeContent.substring(0, 100),
		});

		const article = {
			title: safeTitle,
			author: this.sanitizeForWeChat(author),
			digest: safeDigest,
			content: safeContent,
			content_source_url: '',
			need_open_comment: 0,
			only_fans_can_comment: 0,
			thumb_media_id: this.thumbMediaId,
		};
		const body = { articles: [article] };
		const resp = await requestUrl({
			url: `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${encodeURIComponent(token)}`,
			method: 'POST',
			contentType: 'application/json',
			body: JSON.stringify(body),
		});
		const data = resp.json;
		if (data.errcode === undefined) {
			return data;
		}
		if (data.errcode !== 0) {
			throw new Error(`创建草稿失败: ${data.errmsg || '未知错误'} (code: ${data.errcode})`);
		}
		return data;
	}
}

// ========== Settings Tab ==========

class WeChatFormatSettingTab extends PluginSettingTab {
	plugin: WeChatFormatPlugin;

	constructor(app: App, plugin: WeChatFormatPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'WeChat Format — 公众号排版设置' });
		new Setting(containerEl)
			.setName('排版主题')
			.setDesc('选择文章的整体视觉风格')
			.addDropdown((dd) => {
				Object.values(THEMES).forEach((t) => dd.addOption(t.name, t.label));
				dd.setValue(this.plugin.settings.theme);
				dd.onChange(async (v) => {
					this.plugin.settings.theme = v;
					await this.plugin.saveSettings();
					this.display();
					this.plugin.refreshPreview();
				});
			});
		const themeDesc = THEMES[this.plugin.settings.theme];
		if (themeDesc) {
			containerEl.createEl('p', {
				text: themeDesc.description,
				attr: { style: 'margin:-10px 0 20px 14px;color:#888;font-size:13px;' },
			});
		}
		// H2 heading style
		new Setting(containerEl)
			.setName('H2 标题样式')
			.setDesc('二级标题的装饰风格')
			.addDropdown((dd) => {
				H2_STYLES.forEach((s) => dd.addOption(s.id, s.label));
				dd.setValue(this.plugin.settings.h2Style);
				dd.onChange(async (v) => {
					this.plugin.settings.h2Style = v;
					await this.plugin.saveSettings();
					this.plugin.refreshPreview();
				});
			});
		// H3 heading style
		new Setting(containerEl)
			.setName('H3 标题样式')
			.setDesc('三级标题的装饰风格')
			.addDropdown((dd) => {
				H3_STYLES.forEach((s) => dd.addOption(s.id, s.label));
				dd.setValue(this.plugin.settings.h3Style);
				dd.onChange(async (v) => {
					this.plugin.settings.h3Style = v;
					await this.plugin.saveSettings();
					this.plugin.refreshPreview();
				});
			});
		// H4 heading style
		new Setting(containerEl)
			.setName('H4 标题样式')
			.setDesc('四级标题的装饰风格')
			.addDropdown((dd) => {
				H4_STYLES.forEach((s) => dd.addOption(s.id, s.label));
				dd.setValue(this.plugin.settings.h4Style);
				dd.onChange(async (v) => {
					this.plugin.settings.h4Style = v;
					await this.plugin.saveSettings();
					this.plugin.refreshPreview();
				});
			});
		// Code block border style
		new Setting(containerEl)
			.setName('代码块边框样式')
			.setDesc('选择代码块的边框装饰风格')
			.addDropdown((dd) => {
				CODE_BORDER_STYLES.forEach((s) => dd.addOption(s.id, s.label));
				dd.setValue(this.plugin.settings.codeBorderStyle);
				dd.onChange(async (v) => {
					this.plugin.settings.codeBorderStyle = v;
					await this.plugin.saveSettings();
					this.plugin.refreshPreview();
				});
			});
		new Setting(containerEl)
			.setName('正文字号')
			.setDesc('文章正文的字体大小')
			.addDropdown((dd) => {
				['14px', '15px', '16px', '17px', '18px'].forEach((s) => dd.addOption(s, s));
				dd.setValue(this.plugin.settings.fontSize);
				dd.onChange(async (v) => {
					this.plugin.settings.fontSize = v;
					await this.plugin.saveSettings();
					this.plugin.refreshPreview();
				});
			});

		new Setting(containerEl)
			.setName('行高')
			.setDesc('正文行间距倍数')
			.addDropdown((dd) => {
				['1.5', '1.6', '1.75', '1.8', '2.0'].forEach((s) => dd.addOption(s, s));
				dd.setValue(this.plugin.settings.lineHeight);
				dd.onChange(async (v) => {
					this.plugin.settings.lineHeight = v;
					await this.plugin.saveSettings();
					this.plugin.refreshPreview();
				});
			});

		new Setting(containerEl)
			.setName('图片最大宽度')
			.setDesc('文章中图片的最大宽度')
			.addDropdown((dd) => {
				['80%', '90%', '100%'].forEach((s) => dd.addOption(s, s));
				dd.setValue(this.plugin.settings.imageWidth);
				dd.onChange(async (v) => {
					this.plugin.settings.imageWidth = v;
					await this.plugin.saveSettings();
					this.plugin.refreshPreview();
				});
			});

		new Setting(containerEl)
			.setName('首行缩进')
			.setDesc('是否自动为段落添加首行缩进')
			.addToggle((t) => {
				t.setValue(this.plugin.settings.autoIndent);
				t.onChange(async (v) => {
					this.plugin.settings.autoIndent = v;
					await this.plugin.saveSettings();
					this.plugin.refreshPreview();
				});
			});

		new Setting(containerEl)
			.setName('缩进大小')
			.setDesc('首行缩进的字符数（em）')
			.addSlider((s) => {
				s.setLimits(1, 4, 0.5);
				s.setValue(this.plugin.settings.indentSize);
				s.setDynamicTooltip();
				s.onChange(async (v) => {
					this.plugin.settings.indentSize = v;
					await this.plugin.saveSettings();
					this.plugin.refreshPreview();
				});
			});

		containerEl.createEl('hr', { attr: { style: 'margin:20px 0;' } });
		containerEl.createEl('h3', { text: '📝 自定义引言（可选）' });

		new Setting(containerEl)
			.setName('启用引言')
			.setDesc('在文章标题下方显示一段引言文字')
			.addToggle((t) => {
				t.setValue(this.plugin.settings.enableQuote);
				t.onChange(async (v) => {
					this.plugin.settings.enableQuote = v;
					await this.plugin.saveSettings();
					this.display();
					this.plugin.refreshPreview();
				});
			});

		if (this.plugin.settings.enableQuote) {
			new Setting(containerEl)
				.setName('引言内容')
				.setDesc('显示在文章开头的引用文字')
				.addTextArea((t) => {
					t.setValue(this.plugin.settings.quoteText);
					t.inputEl.style.width = '100%';
					t.inputEl.style.minHeight = '60px';
					t.onChange(async (v) => {
						this.plugin.settings.quoteText = v;
						await this.plugin.saveSettings();
						this.plugin.refreshPreview();
					});
				});

			new Setting(containerEl)
				.setName('引言作者（可选）')
				.setDesc('显示在引言右下方的署名')
				.addText((t) => {
					t.setPlaceholder('例如：某某某');
					t.setValue(this.plugin.settings.quoteAuthor);
					t.onChange(async (v) => {
						this.plugin.settings.quoteAuthor = v;
						await this.plugin.saveSettings();
						this.plugin.refreshPreview();
						});
					});

			new Setting(containerEl)
				.setName('引言字号')
				.setDesc('引言文字的字号大小')
				.addDropdown((dd) => {
					['14px', '15px', '16px', '17px', '18px', '19px', '20px'].forEach((s) => dd.addOption(s, s));
					dd.setValue(this.plugin.settings.quoteFontSize);
					dd.onChange(async (v) => {
						this.plugin.settings.quoteFontSize = v;
						await this.plugin.saveSettings();
						this.plugin.refreshPreview();
					});
				});
		}

		containerEl.createEl('hr', { attr: { style: 'margin:20px 0;' } });
		containerEl.createEl('h3', { text: '📦 底部关注区' });
		new Setting(containerEl)
			.setName('底部关注区')
			.setDesc('在文章底部添加扫码关注、往期内容等固定注释文字')
			.addToggle((t) => {
				t.setValue(this.plugin.settings.addQrCode);
				t.onChange(async (v) => {
					this.plugin.settings.addQrCode = v;
					await this.plugin.saveSettings();
					this.plugin.refreshPreview();
				});
			});

		new Setting(containerEl)
			.setName('关注引导文字')
			.setDesc('底部关注的提示文案')
			.addText((t) => {
				t.setValue(this.plugin.settings.qrCodeText);
				t.onChange(async (v) => {
					this.plugin.settings.qrCodeText = v;
					await this.plugin.saveSettings();
						this.plugin.refreshPreview();
						});
					});

			new Setting(containerEl)
				.setName('关注区字号')
				.setDesc('底部关注引导文字的字号大小')
				.addDropdown((dd) => {
					['14px', '15px', '16px', '17px', '18px', '19px', '20px'].forEach((s) => dd.addOption(s, s));
					dd.setValue(this.plugin.settings.qrCodeFontSize);
					dd.onChange(async (v) => {
						this.plugin.settings.qrCodeFontSize = v;
						await this.plugin.saveSettings();
						this.plugin.refreshPreview();
					});
				});

			// ===== WeChat Official Account Credentials =====

		containerEl.createEl('hr', { attr: { style: 'margin:20px 0;' } });
		containerEl.createEl('h3', { text: '🔑 公众号 API 设置（发送到草稿箱）' });

		new Setting(containerEl)
			.setName('AppID')
			.setDesc('微信公众号后台 → 设置与开发 → 基本配置 → AppID')
			.addText((t) => {
				t.setPlaceholder('wx...');
				t.setValue(this.plugin.settings.appId);
				t.onChange(async (v) => {
					this.plugin.settings.appId = v;
					await this.plugin.saveSettings();
					this.plugin.wechatApi.updateCredentials(
						this.plugin.settings.appId,
						this.plugin.settings.appSecret,
						this.plugin.settings.thumbMediaId
					);
				});
			});

		new Setting(containerEl)
			.setName('AppSecret')
			.setDesc('微信公众号后台 → 设置与开发 → 基本配置 → AppSecret')
			.addText((t) => {
				t.setPlaceholder('请填写 AppSecret');
				t.inputEl.type = 'password';
				t.setValue(this.plugin.settings.appSecret);
				t.onChange(async (v) => {
					this.plugin.settings.appSecret = v;
					await this.plugin.saveSettings();
					this.plugin.wechatApi.updateCredentials(
						this.plugin.settings.appId,
						this.plugin.settings.appSecret,
						this.plugin.settings.thumbMediaId
					);
				});
			});

		new Setting(containerEl)
			.setName('文章作者')
			.setDesc('显示在公众号文章作者栏的名称')
			.addText((t) => {
				t.setPlaceholder('公众号');
				t.setValue(this.plugin.settings.author);
				t.onChange(async (v) => {
					this.plugin.settings.author = v;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('封面图片 MediaID')
			.setDesc('必填。公众号草稿必须设置封面图：在后台「素材库」上传封面图后，将得到的 media_id 粘贴至此')
			.addText((t) => {
				t.setPlaceholder('请填写封面图片的 media_id');
				t.setValue(this.plugin.settings.thumbMediaId);
				t.onChange(async (v) => {
					this.plugin.settings.thumbMediaId = v;
					await this.plugin.saveSettings();
					this.plugin.wechatApi.updateCredentials(
						this.plugin.settings.appId,
						this.plugin.settings.appSecret,
						this.plugin.settings.thumbMediaId
					);
				});
			});

		new Setting(containerEl)
			.setName('上传默认封面')
			.setDesc('自动生成 900×500 灰色封面图片并上传到公众号素材库，media_id 会自动保存到设置')
			.addButton((btn) => {
				btn.setButtonText('上传默认封面');
				btn.setCta();
				btn.onClick(async () => {
					btn.setDisabled(true);
					btn.setButtonText('上传中...');
					try {
						if (!this.plugin.wechatApi.isConfigured()) {
							throw new Error('请先填写 AppID 和 AppSecret');
						}
						const mediaId = await this.plugin.wechatApi.uploadDefaultThumbnail();
						this.plugin.settings.thumbMediaId = mediaId;
						await this.plugin.saveSettings();
						this.plugin.wechatApi.updateCredentials(
							this.plugin.settings.appId,
							this.plugin.settings.appSecret,
							mediaId
						);
						new Notice(`✅ 上传成功！media_id: ${mediaId}`);
						// Force-refresh the setting field value
						this.display();
					} catch (err) {
						new Notice(`❌ 上传失败: ${err.message}`, 8000);
					} finally {
						btn.setDisabled(false);
						btn.setButtonText('上传默认封面');
					}
				});
			});

		new Setting(containerEl)
			.setName('从库选择封面图片')
			.setDesc('从 Obsidian 库中选择一张图片作为封面并上传到素材库')
			.addButton((btn) => {
				btn.setButtonText('选择图片...');
				btn.setCta();
				btn.onClick(async () => {
					new CoverFileSuggestModal(this.plugin.app, this.plugin).open();
				});
			});

		new Setting(containerEl)
			.setName('从剪贴板粘贴封面')
			.setDesc('将剪贴板中的图片直接上传到素材库作为封面（支持截图粘贴）')
			.addButton((btn) => {
				btn.setButtonText('从剪贴板粘贴');
				btn.setCta();
				btn.onClick(async () => {
					try {
						btn.setDisabled(true);
						btn.setButtonText('处理中...');
						const clipboardItems = await navigator.clipboard.read();
						let imageFound = false;
						for (const item of clipboardItems) {
							for (const type of item.types) {
								if (type.startsWith('image/')) {
									const blob = await item.getType(type);
									const arrayBuffer = await blob.arrayBuffer();
									const ext = type.split('/')[1] || 'png';
									new Notice('📤 正在上传剪贴板封面...');
									const result = await this.plugin.wechatApi.uploadImage(arrayBuffer, `clipboard.${ext}`, type);
									this.plugin.settings.thumbMediaId = result.media_id;
									await this.plugin.saveSettings();
									this.plugin.wechatApi.updateCredentials(
										this.plugin.settings.appId,
										this.plugin.settings.appSecret,
										result.media_id
									);
									new Notice(`✅ 剪贴板封面上传成功！media_id: ${result.media_id}`);
									this.display();
									imageFound = true;
									break;
								}
							}
							if (imageFound) break;
						}
						if (!imageFound) {
							new Notice('⚠️ 剪贴板中没有找到图片');
						}
					} catch (e) {
						new Notice(`❌ 剪贴板读取失败: ${e instanceof Error ? e.message : String(e)}`);
					} finally {
						btn.setDisabled(false);
						btn.setButtonText('从剪贴板粘贴');
					}
				});
			});

		containerEl.createEl('hr', { attr: { style: 'margin:20px 0;' } });
		containerEl.createEl('h3', { text: '使用说明' });

		const help = containerEl.createEl('div', {
			attr: { style: 'background:#f8f8f8;padding:16px;border-radius:8px;font-size:13px;line-height:1.7;color:#555;' },
		});
		help.innerHTML = `
			<p><b>📖 使用方法：</b></p>
			<ol style="padding-left:1.5em;">
				<li>在 Obsidian 中打开要排版的笔记</li>
				<li>按 <code>Ctrl+P</code>（Mac: <code>Cmd+P</code>）→ 搜索 "WeChat Format"</li>
				<li>排版后粘贴到公众号编辑器即可</li>
			</ol>
			<p><b>📤 发送到公众号草稿箱：</b></p>
			<ol style="padding-left:1.5em;">
				<li>先在 <b>🔑 公众号 API 设置</b> 中填写 AppID 和 AppSecret</li>
				<li>点击 <b>上传默认封面</b> 按钮自动生成封面图（公众号草稿必须设置封面）</li>
				<li>按 <code>Ctrl+P</code> → 搜索 "📤 发送到公众号草稿箱"</li>
				<li>文章标题自动取自第一个 <code># 标题</code>，摘要取自首段</li>
			</ol>
			<p><b>💡 预览面板</b>会随原稿变化自动刷新，顶部可切主题或直接发送到草稿箱</p>
			<p><b>⚠️ 注意：</b>图片需先上传到公众号素材库，再替换链接。API 凭证仅保存在本地</p>
		`;

		const status = containerEl.createEl('div', {
			attr: { style: 'margin-top:16px;padding:12px;border-radius:8px;font-size:13px;background:#f0f8ff;border:1px solid #d0e8ff;' },
		});
		const configured = this.plugin.settings.appId && this.plugin.settings.appSecret;
		status.innerHTML = configured
			? `<b>✅ 公众号 API 状态：</b>已配置（AppID: ${this.plugin.settings.appId.substring(0, 8)}...）`
			: `<b>⚠️ 公众号 API 状态：</b>未配置，请填写 AppID 和 AppSecret`;
	}
}

// ========== Cover Image Selector Modal ==========

class CoverFileSuggestModal extends SuggestModal<TFile> {
	private plugin: WeChatFormatPlugin;
	private imageFiles: TFile[];

	constructor(app: App, plugin: WeChatFormatPlugin) {
		super(app);
		this.plugin = plugin;
		this.imageFiles = app.vault.getFiles().filter(
			(f: TFile) => /\.(png|jpe?g|gif|webp|bmp)$/i.test(f.name)
		);
		this.setPlaceholder('搜索图片文件...');
		this.limit = 20;
	}

	getSuggestions(query: string): TFile[] {
		const q = query.toLowerCase();
		return this.imageFiles.filter(f =>
			f.path.toLowerCase().includes(q)
		);
	}

	renderSuggestion(file: TFile, el: HTMLElement) {
		el.createEl('div', { text: file.path });
	}

	async onChooseSuggestion(file: TFile) {
		try {
			new Notice(`📤 正在上传封面: ${file.name}`);
			const arrayBuffer = await this.app.vault.readBinary(file);
			const ext = file.extension.toLowerCase();
			const mimeTypes: Record<string, string> = {
				'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
				'png': 'image/png', 'gif': 'image/gif',
				'webp': 'image/webp', 'bmp': 'image/bmp',
			};
			const result = await this.plugin.wechatApi.uploadImage(arrayBuffer, file.name, mimeTypes[ext] || 'image/jpeg');
			this.plugin.settings.thumbMediaId = result.media_id;
			await this.plugin.saveSettings();
			this.plugin.wechatApi.updateCredentials(
				this.plugin.settings.appId,
				this.plugin.settings.appSecret,
				result.media_id
			);
			new Notice(`✅ 封面上传成功！media_id: ${result.media_id}`);
		} catch (e) {
			new Notice(`❌ 封面上传失败: ${e instanceof Error ? e.message : String(e)}`);
		}
	}
}

// ========== Main Plugin ==========

const WECHAT_PREVIEW_VIEW = 'wechat-preview-view';

class WeChatPreviewView extends ItemView {
	source: string;
	plugin: WeChatFormatPlugin;
	debounceTimer: number | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: WeChatFormatPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return WECHAT_PREVIEW_VIEW;
	}

	getDisplayText(): string {
		return 'WeChat Preview';
	}

	getIcon(): string {
		return 'file-text';
	}

	async onOpen() {
		// containerEl is always present. Style it as a flex column so the toolbar
		// stays at top and the content area scrolls independently.
		this.containerEl.empty();
		this.containerEl.setAttribute(
			'style',
			'height:100%;display:flex;flex-direction:column;overflow:hidden;'
		);

		// Create toolbar row 1: action buttons
		const actionRow = this.containerEl.createEl('div', {
			attr: {
				style:
					'flex-shrink:0;display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:8px 10px 4px 10px;background:#f5f5f5;border-radius:6px 6px 0 0;',
			},
		});

		// Send to draft button (leftmost)
		const sendBtn = actionRow.createEl('button', {
			text: '📤 发送草稿',
			attr: {
				style:
					'padding:6px 14px;border-radius:4px;border:1px solid #27ae60;background:#27ae60;color:#fff;cursor:pointer;font-size:13px;',
			},
		});
		sendBtn.addEventListener('click', () => this.plugin.sendToDraft());

		// Spacer — push remaining buttons to the right
		actionRow.createEl('span', { attr: { style: 'flex:1;' } });

		// Copy button
		const copyBtn = actionRow.createEl('button', {
			text: '📋 复制',
			attr: {
				style:
					'padding:6px 14px;border-radius:4px;border:1px solid #ddd;background:#fff;cursor:pointer;font-size:13px;',
			},
		});
		copyBtn.addEventListener('click', () => this.plugin.formatToClipboard());

		// Export button
		const exportBtn = actionRow.createEl('button', {
			text: '💾 导出',
			attr: {
				style:
					'padding:6px 14px;border-radius:4px;border:1px solid #ddd;background:#fff;cursor:pointer;font-size:13px;',
			},
		});
		exportBtn.addEventListener('click', () => this.plugin.exportHTML());

		// Refresh button
		const refreshBtn = actionRow.createEl('button', {
			text: '🔄 刷新',
			attr: {
				style:
					'padding:6px 14px;border-radius:4px;border:1px solid #ddd;background:#fff;cursor:pointer;font-size:13px;',
			},
		});
		refreshBtn.addEventListener('click', () => this.refreshNow());

		// Create toolbar row 2: style controls
		const styleRow = this.containerEl.createEl('div', {
			attr: {
				style:
					'flex-shrink:0;display:flex;gap:4px;flex-wrap:wrap;align-items:center;padding:4px 10px 8px 10px;background:#f5f5f5;border-radius:0 0 6px 6px;',
			},
		});

		// Theme dropdown
		styleRow.createEl('span', { text: '主题:', attr: { style: 'font-size:13px;font-weight:500;margin-right:2px;' } });
		const themeSelect = styleRow.createEl('select', {
			attr: { style: 'padding:3px 6px;border-radius:4px;border:1px solid #ddd;font-size:12px;' },
		});
		for (const [key, theme] of Object.entries(THEMES)) {
			const opt = themeSelect.createEl('option', { value: key, text: theme.label });
			if (key === this.plugin.settings.theme) opt.selected = true;
		}
		themeSelect.addEventListener('change', () => {
			this.plugin.settings.theme = themeSelect.value;
			this.plugin.saveSettings();
			this.refreshNow();
		});

		// H2 heading style dropdown
		styleRow.createEl('span', { text: ' H2:', attr: { style: 'font-size:13px;font-weight:500;margin-right:2px;' } });
		const h2Select = styleRow.createEl('select', {
			attr: { style: 'padding:3px 6px;border-radius:4px;border:1px solid #ddd;font-size:12px;' },
		});
		H2_STYLES.forEach((s) => {
			const opt = h2Select.createEl('option', { value: s.id, text: s.label });
			if (s.id === this.plugin.settings.h2Style) opt.selected = true;
		});
		h2Select.addEventListener('change', () => {
			this.plugin.settings.h2Style = h2Select.value;
			this.plugin.saveSettings();
			this.refreshNow();
		});

		// H3 heading style dropdown
		styleRow.createEl('span', { text: ' H3:', attr: { style: 'font-size:13px;font-weight:500;margin-right:2px;' } });
		const h3Select = styleRow.createEl('select', {
			attr: { style: 'padding:3px 6px;border-radius:4px;border:1px solid #ddd;font-size:12px;' },
		});
		H3_STYLES.forEach((s) => {
			const opt = h3Select.createEl('option', { value: s.id, text: s.label });
			if (s.id === this.plugin.settings.h3Style) opt.selected = true;
		});
		h3Select.addEventListener('change', () => {
			this.plugin.settings.h3Style = h3Select.value;
			this.plugin.saveSettings();
			this.refreshNow();
		});

		// H4 heading style dropdown
		styleRow.createEl('span', { text: ' H4:', attr: { style: 'font-size:13px;font-weight:500;margin-right:2px;' } });
		const h4Select = styleRow.createEl('select', {
			attr: { style: 'padding:3px 6px;border-radius:4px;border:1px solid #ddd;font-size:12px;' },
		});
		H4_STYLES.forEach((s) => {
			const opt = h4Select.createEl('option', { value: s.id, text: s.label });
			if (s.id === this.plugin.settings.h4Style) opt.selected = true;
		});
		h4Select.addEventListener('change', () => {
			this.plugin.settings.h4Style = h4Select.value;
			this.plugin.saveSettings();
			this.refreshNow();
		});

		// Code block border style dropdown
		styleRow.createEl('span', { text: ' 代码块:', attr: { style: 'font-size:13px;font-weight:500;margin-right:2px;' } });
		const codeBorderSelect = styleRow.createEl('select', {
			attr: { style: 'padding:3px 6px;border-radius:4px;border:1px solid #ddd;font-size:12px;' },
		});
		CODE_BORDER_STYLES.forEach((s) => {
			const opt = codeBorderSelect.createEl('option', { value: s.id, text: s.label });
			if (s.id === this.plugin.settings.codeBorderStyle) opt.selected = true;
		});
		codeBorderSelect.addEventListener('change', () => {
			this.plugin.settings.codeBorderStyle = codeBorderSelect.value;
			this.plugin.saveSettings();
			this.refreshNow();
		});

		// Spacer — fill remaining width so right edge aligns with action row
		styleRow.createEl('span', { attr: { style: 'flex:1;' } });// Content area — fills remaining space, scrollable
		const contentArea = this.containerEl.createEl('div', {
			attr: {
				style:
					'flex:1;overflow-y:auto;padding:20px;max-width:700px;margin:0 auto;font-size:16px;line-height:1.75;',
			},
		});
		contentArea.innerHTML =
			'<p style="color:#999;text-align:center;margin-top:100px;">打开一篇 Markdown 笔记，<br>点击左下角「WeChat Preview」按钮预览排版效果。</p>';

		// Store on a private field so setContent/refreshNow only write into it
		(this as any)._renderEl = contentArea;

		// Auto-refresh preview on open — without waiting for editor-change
		setTimeout(() => this.refreshNow(), 100);
	}

	setContent(html: string) {
		const el = (this as any)._renderEl;
		if (el) {
			el.innerHTML = html;
			// Attach copy handlers for code block copy buttons
			this.attachCopyHandlers(el);
		}
	}

	/** Attach click-to-copy handlers to all code block copy buttons */
	private attachCopyHandlers(el: HTMLElement) {
		el.querySelectorAll('.wechat-copy-btn').forEach((btn) => {
			const wrapper = btn.closest('div');
			const pre = wrapper?.querySelector('pre');
			if (!pre) return;
			btn.addEventListener('click', async () => {
				const code = pre.textContent || '';
				try {
					await navigator.clipboard.writeText(code);
					(btn as HTMLElement).textContent = '✅ 已复制';
					setTimeout(() => {
						(btn as HTMLElement).textContent = '📋 复制代码';
					}, 2000);
				} catch {
					// Fallback: select and copy
					const range = document.createRange();
					range.selectNodeContents(pre);
					const sel = window.getSelection();
					if (sel) {
						sel.removeAllRanges();
						sel.addRange(range);
					}
					(btn as HTMLElement).textContent = '✅ 已复制';
					setTimeout(() => {
						(btn as HTMLElement).textContent = '📋 复制代码';
					}, 2000);
				}
			});
		});
	}

	scheduleRefresh() {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}
		this.debounceTimer = window.setTimeout(() => {
			this.refreshNow();
		}, 300);
	}

	private async refreshNow() {
		const editor = this.plugin.getEditor();
		const el = (this as any)._renderEl;
		if (!el || !editor) {
			// Toolbar not built yet, or no editor – skip refresh (don't overwrite toolbar)
			return;
		}
		const markdown = editor.getValue();
		if (!markdown) {
			el.innerHTML = '<p style="color:#999;text-align:center;">当前文档为空</p>';
			return;
		}
		try {
			const html = await this.plugin.renderToWeChat(markdown);
			el.innerHTML = html;

			// Attach copy button handlers
			this.attachCopyHandlers(el);
		} catch (e) {
			el.innerHTML = `<p style="color:#e74c3c;">渲染出错: ${e}</p>`;
		}
	}

	onClose() {
		// containerEl is always the safe root; contentEl may not be initialized
		if (this.containerEl) {
			this.containerEl.empty();
		}
	}
}

class WeChatFormatPlugin extends Plugin {
	settings: WeChatFormatSettings;
	previewView: WeChatPreviewView | null = null;
	private editorChangeHandler: () => void;
	private wechatApi: WeChatApi;

	async onload() {
		await this.loadSettings();
		this.wechatApi = new WeChatApi(
			this.settings.appId,
			this.settings.appSecret,
			this.settings.thumbMediaId
		);

		// Commands
		this.addCommand({
			id: 'wechat-format-copy',
			name: '📋 复制排版到剪贴板（WeChat Format）',
			editorCallback: () => this.formatToClipboard(),
		});

		this.addCommand({
			id: 'wechat-format-preview',
			name: '🖼️ 打开公众号排版预览面板',
			callback: () => this.openPreview(),
		});

		this.addCommand({
			id: 'wechat-format-export',
			name: '💾 导出为公众号 HTML 文件',
			editorCallback: () => this.exportHTML(),
		});

		this.addCommand({
			id: 'wechat-format-send-draft',
			name: '📤 发送到公众号草稿箱',
			editorCallback: () => this.sendToDraft(),
		});

		// Settings tab
		this.addSettingTab(new WeChatFormatSettingTab(this.app, this));

		// Register preview view
		this.registerView(WECHAT_PREVIEW_VIEW, (leaf) => {
			this.previewView = new WeChatPreviewView(leaf, this);
			return this.previewView;
		});

		// FIX 1: Live preview – listen for editor changes
		this.editorChangeHandler = () => {
			if (this.previewView) {
				this.previewView.scheduleRefresh();
			}
		};
		this.registerEvent(
			this.app.workspace.on('editor-change', this.editorChangeHandler)
		);

		// FIX 2: Auto-refresh preview when switching to a different note
		this.registerEvent(
			this.app.workspace.on('file-open', () => {
				if (this.previewView) {
					this.previewView.scheduleRefresh();
				}
			})
		);

		// FIX 3: Recover preview after restart – auto-refresh when layout is ready
		this.app.workspace.onLayoutReady(() => {
			const leaves = this.app.workspace.getLeavesOfType(WECHAT_PREVIEW_VIEW);
			if (leaves.length > 0) {
				// Obsidian restored a preview view; re-link it
				for (const leaf of leaves) {
					if (leaf.view instanceof WeChatPreviewView) {
						this.previewView = leaf.view;
						setTimeout(() => this.refreshPreview(), 500);
					}
				}
			}
		});
	}

	onunload() {
		try {
			this.app.workspace.detachLeavesOfType(WECHAT_PREVIEW_VIEW);
		} catch (e) {
			// Ignore detach errors – Obsidian may have already detached the leaf
			console.warn('[WeChatFormat] onunload detach warning:', e);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// ===== Public Methods =====

	// Write HTML+text to clipboard (rich text) for WeChat editor compatibility.
	// Tries ClipboardItem (preferred, gives real HTML formatting); falls back to
	// execCommand('copy'); if that's blocked, falls back to plain-text writeText
	// so the user at least gets the content.
	copyHTMLToClipboard(html: string) {
		// Prefer modern ClipboardItem (provides both text/html and text/plain)
		try {
			if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
				const plain = (new DOMParser()).parseFromString(html, 'text/html').body.innerText;
				const item = new ClipboardItem({
					'text/html': new Blob([html], { type: 'text/html' }),
					'text/plain': new Blob([plain], { type: 'text/plain' }),
				});
				return navigator.clipboard.write([item]).then(
					() => true,
					(err) => {
						console.error('[WeChatFormat] ClipboardItem.write failed:', err);
						return null;
					}
				);
			}
		} catch (e) {
			console.error('[WeChatFormat] ClipboardItem rejected:', e);
		}

		// Fallback: execCommand('copy') with a hidden selectable node
		try {
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = html;
			tempDiv.style.cssText =
				'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;';
			document.body.appendChild(tempDiv);
			const range = document.createRange();
			range.selectNodeContents(tempDiv);
			const sel = window.getSelection();
			if (sel) {
				sel.removeAllRanges();
				sel.addRange(range);
			}
			const ok = document.execCommand('copy');
			if (sel) sel.removeAllRanges();
			tempDiv.remove();
			return ok ? true : false;
		} catch (e) {
			console.error('[WeChatFormat] execCommand copy failed:', e);
			return false;
		}
	}

	async formatToClipboard() {
		const editor = this.getEditor();
		if (!editor) {
			new Notice('⚠️ 请先打开一个笔记文件');
			return;
		}
		const markdown = editor.getValue();
		const wechatHtml = await this.renderToWeChat(markdown);
		try {
			const res = await this.copyHTMLToClipboard(wechatHtml);
			if (res === true) {
				new Notice('✅ 排版内容已复制到剪贴板！直接粘贴到公众号编辑器即可');
			} else if (res === false) {
				new Notice('❌ 复制失败。试试「导出为 HTML」命令后手动复制');
			} else {
				new Notice('⚠️ 复制仅文本格式（无样式）。试试「导出 HTML」命令');
			}
		} catch (e) {
			new Notice(`❌ 复制失败: ${String(e)}`);
		}
	}

	async openPreview() {
		const existing = this.app.workspace.getLeavesOfType(WECHAT_PREVIEW_VIEW);
		if (existing.length > 0) {
			this.app.workspace.revealLeaf(existing[0]);
			this.refreshPreview();
			return;
		}

		const leaf = this.app.workspace.getRightLeaf(false);
		if (!leaf) {
			new Notice('⚠️ 无法创建预览面板');
			return;
		}

		await leaf.setViewState({ type: WECHAT_PREVIEW_VIEW, active: true });
		this.app.workspace.revealLeaf(leaf);
	}

	async refreshPreview() {
		if (!this.previewView) return;

		const editor = this.getEditor();
		if (!editor) {
			const inner = (this.previewView as any)._renderEl;
			if (!inner) {
				// Toolbar not yet built (view opening) – don't overwrite
				return;
			}
			inner.innerHTML = '<p style="color:#999;text-align:center;padding:40px;">请打开一个笔记文件以预览排版效果</p>';
			return;
		}

		const markdown = editor.getValue();
		if (!markdown.trim()) {
			const inner = (this.previewView as any)._renderEl;
			if (!inner) return;
			inner.innerHTML = '<p style="color:#999;text-align:center;padding:40px;">当前笔记为空</p>';
			return;
		}

		const html = await this.renderToWeChat(markdown);
		this.previewView.setContent(html);
	}

	async exportHTML() {
		const editor = this.getEditor();
		if (!editor) {
			new Notice('⚠️ 请先打开一个笔记文件');
			return;
		}

		const markdown = editor.getValue();
		if (!markdown.trim()) {
			new Notice('⚠️ 当前笔记为空');
			return;
		}

		const wechatHtml = await this.renderToWeChat(markdown);
		const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>微信公众号文章</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;">
${wechatHtml}
</body>
</html>`;

		try {
			const activeFile = this.app.workspace.getActiveFile();
			let basePath = activeFile ? activeFile.path.replace(/\.md$/, '') : 'WeChat-Article-' + Date.now();
			const exportPath = basePath + '-wechat.html';
			const exportFile = await this.app.vault.create(exportPath, fullHtml);
			new Notice(`✅ 已导出: ${exportFile.path}`);
		} catch (e) {
			new Notice('❌ 导出失败: ' + e.message);
		}
	}

	// ===== Send to WeChat Draft =====

	async sendToDraft() {
		if (!this.wechatApi.isConfigured()) {
			new Notice('⚠️ 请先在设置中填写 AppID 和 AppSecret');
			return;
		}

		const editor = this.getEditor();
		if (!editor) {
			new Notice('⚠️ 请先打开一个笔记文件');
			return;
		}

		const markdown = editor.getValue();
		if (!markdown.trim()) {
			new Notice('⚠️ 当前笔记为空');
			return;
		}

		// Update API credentials (in case user changed them since plugin load)
		this.wechatApi.updateCredentials(
			this.settings.appId,
			this.settings.appSecret,
			this.settings.thumbMediaId
		);

		// Auto-upload default cover if none configured
		if (!this.settings.thumbMediaId) {
			new Notice('📤 正在自动上传默认封面...');
			try {
				const mediaId = await this.wechatApi.uploadDefaultThumbnail();
				this.settings.thumbMediaId = mediaId;
				await this.saveSettings();
				this.wechatApi.updateCredentials(
					this.settings.appId,
					this.settings.appSecret,
					mediaId
				);
			} catch (e) {
				new Notice(`❌ 自动上传封面失败: ${e.message}，请手动在设置中操作`);
				return;
			}
		}

		// Extract title, author, digest
		const title = this.extractTitle(markdown, this.app.workspace.getActiveFile()!);
		const author = this.settings.author || '公众号';
		const digest = this.extractDigest(markdown);

		if (!title) {
			new Notice('⚠️ 无法提取标题，请确保文章以 # 标题 开头');
			return;
		}

		new Notice('📤 正在生成排版并发送到公众号...');

		try {
			let wechatHtml = await this.renderToWeChat(markdown);

			// Upload article images to WeChat material library and replace src
			wechatHtml = await this.uploadArticleImages(wechatHtml);

			const result = await this.wechatApi.createDraft(title, wechatHtml, author, digest);
			new Notice(`✅ 已发送到草稿箱！media_id: ${result.media_id || '未知'}`);
		} catch (e) {
			// Log full error details for debugging
			const errorDetail = e instanceof Error
				? `${e.message}\n${(e.stack || '').split('\n').slice(0, 3).join('\n')}`
				: String(e);
			console.error('[WeChat Format] sendToDraft error:', errorDetail);
			new Notice(`❌ 发送失败: ${e instanceof Error ? e.message : String(e)}`);
		}

	}
	/**
	 * Extract title from markdown: first H1 heading, or filename if no heading found.
	 */
	private extractTitle(markdown: string, file?: any): string {
		// Use Obsidian's metadata cache for reliable heading extraction.
		// This avoids all regex pitfalls with code blocks, inline code, etc.
		if (file) {
			try {
				const cache = this.app.metadataCache.getCache(file);
				if (cache?.headings?.length) {
					return cache.headings[0].heading;
				}
			} catch (e) {
				// Fall through to filename fallback
			}
		}

		// Fallback: use file name (without extension) — no regex-based extraction
		// to avoid matching # comments inside code blocks.
		if (file) {
			return file.basename;
		}
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile) {
			return activeFile.basename;
		}
		return '';
	}

	/**
	 * Extract digest/summary: first paragraph of content (up to 120 chars)
	 */
	private extractDigest(markdown: string): string {
		const noTitle = markdown.replace(/^#\s+.*$/m, '').trim();
		const paraMatch = noTitle.match(/^(.{10,200})/m);
		if (paraMatch) {
			let digest = paraMatch[1].replace(/[#*_`\[\]]/g, '').trim();
			if (digest.length > 120) digest = digest.substring(0, 117) + '...';
			return digest;
		}
		return '';
	}

	/**
	 * Parse WeChat HTML, upload local images to WeChat material library,
	 * and replace their src with permanent WeChat CDN URLs.
	 */
	private async uploadArticleImages(wechatHtml: string): Promise<string> {
		const parser = new DOMParser();
		const doc = parser.parseFromString(`<div>${wechatHtml}</div>`, 'text/html');
		const root = doc.body.firstElementChild as HTMLElement;
		const imgs = root.querySelectorAll('img');
		if (imgs.length === 0) return wechatHtml;

		new Notice(`📷 正在上传 ${imgs.length} 张图片到素材库...`);

		let successCount = 0;
		let failCount = 0;
		let modifiedCount = 0;

		for (const img of Array.from(imgs)) {
			const src = img.getAttribute('src') || '';
			if (!src) continue;

			// Skip external URLs (already accessible)
			if (src.startsWith('http://') || src.startsWith('https://')) continue;
			// Skip data URLs (already embedded)
			if (src.startsWith('data:')) continue;

			try {
				// For local app:// URLs, fetch directly
				const response = await fetch(src);
				if (!response.ok) {
					throw new Error(`Fetch failed: HTTP ${response.status}`);
				}
				const blob = await response.blob();
				const arrayBuffer = await blob.arrayBuffer();

				// Determine mime type and filename from the URL path
				const urlPath = src.split('?')[0];
				const urlParts = urlPath.split('/');
				const rawFilename = urlParts[urlParts.length - 1] || 'image';
				const filename = decodeURIComponent(rawFilename);
				const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
				const mimeTypes: Record<string, string> = {
					'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
					'png': 'image/png', 'gif': 'image/gif',
					'webp': 'image/webp', 'bmp': 'image/bmp',
					'svg': 'image/svg+xml',
				};
				const mimeType = mimeTypes[ext] || blob.type || 'image/jpeg';

				// Upload to WeChat
				const result = await this.wechatApi.uploadImage(arrayBuffer, filename, mimeType);
				// Replace src directly in DOM
				img.setAttribute('src', result.url);
				successCount++;
				modifiedCount++;
			} catch (e) {
				failCount++;
				const msg = e instanceof Error ? e.message : String(e);
				new Notice(`⚠️ 图片上传失败: ${src.split('/').pop()} — ${msg}`);
				console.error(`[WeChat Format] Failed to upload image: ${src}`, e);
				// Replace img with a visible text placeholder so draft doesn't show broken image
				const placeholder = doc.createElement('span');
				placeholder.textContent = `[图片: ${src.split('/').pop() || 'unknown'}]`;
				placeholder.setAttribute('style', 'color:#999;font-size:0.9em;');
				img.parentNode?.replaceChild(placeholder, img);
				modifiedCount++;
			}
		}

		if (modifiedCount > 0) {
			const total = successCount + failCount;
			if (failCount === 0) {
				new Notice(`✅ ${successCount} 张图片已上传到素材库`);
			} else {
				new Notice(`✅ ${successCount}/${total} 张上传成功，${failCount} 张失败（详见控制台）`);
			}
			return root.innerHTML;
		} else {
			if (failCount > 0) {
				new Notice(`⚠️ 所有 ${failCount} 张图片上传失败，请查看控制台日志`);
			}
			return wechatHtml;
		}
	}

	// ===== Core Rendering =====

	async renderToWeChat(markdown: string): Promise<string> {
		// Strip YAML frontmatter (properties) — they are not part of article content
		markdown = markdown.replace(/^---[\s\S]*?---\n*/, '');
		const html = await this.markdownToHTML(markdown);
		// DIAGNOSTIC: log raw HTML structure to console
		console.log('[WeChatFormat] Raw HTML from markdownToHTML:', {
			length: html.length,
			olCount: (html.match(/<ol[ >]/gi) || []).length,
			liCount: (html.match(/<li[ >]/gi) || []).length,
			preCount: (html.match(/<pre[ >]/gi) || []).length,
			olStarts: [...html.matchAll(/<ol\s[^>]*start="(\d+)"/gi)].map(m => m[1]),
		});
		let wechatHtml = convertToWeChatHTML(html, this.settings);

		// Prepend custom quote if enabled
		if (this.settings.enableQuote && this.settings.quoteText.trim()) {
			const c = THEMES[this.settings.theme]?.colors;
			const quoteHtml = `<section style="margin:0.5em 0 1em 0;padding:14px 18px;background:${c?.quoteBg || '#f9f9f9'};border-radius:4px;border-left:4px solid ${c?.quoteBorder || '#c0392b'};font-family:-apple-system,'Helvetica Neue','PingFang SC','Microsoft YaHei',sans-serif;">
<p style="margin:0 0 ${this.settings.quoteAuthor ? '8px' : '0'} 0;font-size:${this.settings.quoteFontSize};line-height:${this.settings.lineHeight};color:${c?.text || '#333'};font-weight:700;font-style:italic;">${this.escapeHTML(this.settings.quoteText)}</p>
${this.settings.quoteAuthor ? `<p style="margin:0;font-size:0.9em;color:${c?.primary || '#c0392b'};text-align:right;">—— ${this.escapeHTML(this.settings.quoteAuthor)}</p>` : ''}
</section>`;
			wechatHtml = wechatHtml.replace('<section', quoteHtml + '\n<section');
		}

		return wechatHtml;
	}

	private escapeHTML(str: string): string {
		return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}

	private async markdownToHTML(markdown: string): Promise<string> {
		const tempDiv = document.createElement('div');
		await MarkdownRenderer.render(this.app, markdown, tempDiv, '/', this);
		return tempDiv.innerHTML;
	}

	getEditor() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) return view.editor;

		// Active view is not a MarkdownView (e.g., preview panel has focus).
		// Match the editor to the active file instead of returning the first editor found.
		try {
			const activeFile = this.app.workspace.getActiveFile();
			const leaves = this.app.workspace.getLeavesOfType('markdown');
			// First pass: match by active file
			if (activeFile) {
				for (const leaf of leaves) {
					const v = leaf.view;
					if (v instanceof MarkdownView && v.file === activeFile && v.editor) {
						return v.editor;
					}
				}
			}
			// Fallback: first markdown editor with content
			for (const leaf of leaves) {
				const v = leaf.view;
				if (v instanceof MarkdownView && v.editor) return v.editor;
			}
		} catch (e) {}
		return null;
	}
}
// Obsidian plugin loader expects module.exports to be the plugin class
if (typeof module !== 'undefined' && module.exports) {
	module.exports = WeChatFormatPlugin;
}