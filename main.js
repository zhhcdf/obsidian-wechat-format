// main.ts
var { Plugin, MarkdownRenderer, PluginSettingTab, Setting, App, Notice, ItemView, WorkspaceLeaf, MarkdownView, requestUrl, TFile, SuggestModal } = require("obsidian");
var DEFAULT_SETTINGS = {
  theme: "classic",
  fontSize: "16px",
  lineHeight: "1.75",
  imageWidth: "100%",
  addQrCode: false,
  qrCodeText: "\u626B\u7801\u5173\u6CE8",
  autoIndent: false,
  indentSize: 2,
  enableQuote: false,
  quoteText: "",
  quoteAuthor: "",
  quoteFontSize: "16px",
  qrCodeFontSize: "16px",
  appId: "",
  appSecret: "",
  author: "",
  thumbMediaId: ""
};
var THEMES = {
  classic: {
    name: "classic",
    label: "\u{1F4F0} \u7ECF\u5178\u5546\u52A1",
    description: "\u6B63\u5F0F\u3001\u7A33\u91CD\u7684\u7EA2\u9ED1\u914D\u8272\uFF0C\u9002\u5408\u4F01\u4E1A\u516C\u4F17\u53F7",
    colors: {
      primary: "#c0392b",
      background: "#ffffff",
      text: "#333333",
      heading: "#c0392b",
      accent: "#e74c3c",
      border: "#e0e0e0",
      codeBg: "#d0d0d0",
      codeText: "#2c3e50",
      quoteBg: "#fef9f9",
      quoteBorder: "#c0392b",
      tableHeader: "#c0392b",
      tableBorder: "#e0e0e0",
      tableAlt: "#fdf2f2"
    }
  },
  modern: {
    name: "modern",
    label: "\u{1F33F} \u6E05\u65B0\u73B0\u4EE3",
    description: "\u84DD\u7EFF\u914D\u8272\uFF0C\u7B80\u7EA6\u6E05\u723D\uFF0C\u9002\u5408\u79D1\u6280/\u751F\u6D3B\u65B9\u5F0F\u53F7",
    colors: {
      primary: "#2ecc71",
      background: "#ffffff",
      text: "#2c3e50",
      heading: "#27ae60",
      accent: "#1abc9c",
      border: "#d5f4e6",
      codeBg: "#c8e6c9",
      codeText: "#1a5276",
      quoteBg: "#f0faf4",
      quoteBorder: "#2ecc71",
      tableHeader: "#27ae60",
      tableBorder: "#d5f4e6",
      tableAlt: "#f0faf4"
    }
  },
  minimal: {
    name: "minimal",
    label: "\u26AA \u6781\u7B80\u7559\u767D",
    description: "\u5927\u91CF\u7559\u767D\uFF0C\u4EC5\u7528\u7070\u8272\u8C03\uFF0C\u9002\u5408\u6DF1\u5EA6\u9605\u8BFB\u5185\u5BB9",
    colors: {
      primary: "#666666",
      background: "#ffffff",
      text: "#444444",
      heading: "#222222",
      accent: "#888888",
      border: "#eeeeee",
      codeBg: "#cccccc",
      codeText: "#444444",
      quoteBg: "#fafafa",
      quoteBorder: "#999999",
      tableHeader: "#555555",
      tableBorder: "#eeeeee",
      tableAlt: "#fafafa"
    }
  },
  warm: {
    name: "warm",
    label: "\u2615 \u6E29\u6696\u6587\u827A",
    description: "\u6696\u6A59\u68D5\u8272\u8C03\uFF0C\u9002\u5408\u6587\u5B66/\u60C5\u611F/\u751F\u6D3B\u7C7B\u6587\u7AE0",
    colors: {
      primary: "#e67e22",
      background: "#fefcf7",
      text: "#5d4037",
      heading: "#d35400",
      accent: "#f39c12",
      border: "#f0e6d3",
      codeBg: "#fdf6ec",
      codeText: "#5d4037",
      quoteBg: "#fef9ef",
      quoteBorder: "#e67e22",
      tableHeader: "#d35400",
      tableBorder: "#f0e6d3",
      tableAlt: "#fef9ef"
    }
  },
  tech: {
    name: "tech",
    label: "\u{1F4BB} \u6781\u5BA2\u79D1\u6280",
    description: "\u6DF1\u8272\u4EE3\u7801\u5757\u3001\u84DD\u8272\u4E3B\u9898\uFF0C\u9002\u5408\u6280\u672F/\u7F16\u7A0B\u6587\u7AE0",
    colors: {
      primary: "#3498db",
      background: "#ffffff",
      text: "#2c3e50",
      heading: "#2980b9",
      accent: "#3498db",
      border: "#d6eaf8",
      codeBg: "#1e1e2e",
      codeText: "#cdd6f4",
      quoteBg: "#eaf2f8",
      quoteBorder: "#3498db",
      tableHeader: "#2980b9",
      tableBorder: "#d6eaf8",
      tableAlt: "#eaf2f8"
    }
  },
  nord: {
    name: "nord",
    label: "\u{1F3D4}\uFE0F Nord \u5317\u6B27",
    description: "\u5317\u6B27\u6781\u7B80\u914D\u8272\uFF0C\u67D4\u548C\u8212\u9002\uFF0C\u9002\u5408\u5404\u7C7B\u5185\u5BB9",
    colors: {
      primary: "#5e81ac",
      background: "#ffffff",
      text: "#4c566a",
      heading: "#2e3440",
      accent: "#88c0d0",
      border: "#e5e9f0",
      codeBg: "#f0f2f5",
      codeText: "#4c566a",
      quoteBg: "#f0f4f8",
      quoteBorder: "#5e81ac",
      tableHeader: "#5e81ac",
      tableBorder: "#e5e9f0",
      tableAlt: "#f0f4f8"
    }
  }
};
function convertToWeChatHTML(html, settings) {
  const theme = THEMES[settings.theme] || THEMES.classic;
  const c = theme.colors;
  const parser = new DOMParser();
  const doc = parser.parseFromString(
    `<div class="wechat-root">${html}</div>`,
    "text/html"
  );
  const root = doc.body.firstElementChild;
  if (!root) return html;
  const allOls = root.querySelectorAll("ol");
  for (const ol of allOls) {
    const startNum = parseInt(ol.getAttribute("start") || "1", 10);
    const liItems = Array.from(ol.children).filter((c2) => c2.tagName === "LI");
    liItems.forEach((li, idx) => {
      li.setAttribute("data-li-index", String(startNum + idx));
    });
  }
  applyStyles(root, c, settings, doc);
  const containerStyle = [
    `max-width:677px`,
    `margin:0 auto`,
    `padding:10px 15px`,
    `background:${c.background}`,
    `font-family:-apple-system,'Helvetica Neue','PingFang SC','Microsoft YaHei',sans-serif`,
    `font-size:${settings.fontSize}`,
    `line-height:${settings.lineHeight}`,
    `color:${c.text}`
  ].join(";");
  let result = root.innerHTML;
  result = result.replace(/<p[^>]*>\s*(?:<br\s*\/?>)?\s*<\/p>/gi, "");
  result = `<section style="${containerStyle}">
${result}
</section>`;
  if (settings.addQrCode) {
    result += `
<section style="max-width:677px;margin:20px auto 0;padding:20px 15px;text-align:center;background:${c.background};border-top:1px solid ${c.border};font-family:-apple-system,'Helvetica Neue','PingFang SC','Microsoft YaHei',sans-serif;font-size:14px;color:#999;">
			<p style="margin:0;font-weight:700;font-size:${settings.qrCodeFontSize};">${settings.qrCodeText || "\u626B\u7801\u5173\u6CE8"}</p>
			<p style="margin:0;font-size:14px;">&nbsp;</p>
		</section>`;
  }
  return result;
}
function applyStyles(el, c, settings, doc) {
  for (let i = 0; i < el.children.length; i++) {
    applyStyles(el.children[i], c, settings, doc);
  }
  const tag = el.tagName.toLowerCase();
  switch (tag) {
    case "h1":
    case "h2":
      setStyle(el, headingStyle(c, tag, true));
      break;
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      setStyle(el, headingStyle(c, tag, false));
      break;
    case "p":
      setStyle(el, paragraphStyle(c, settings));
      break;
    case "blockquote":
      setStyle(el, [
        `margin:1em 0`,
        `padding:12px 16px`,
        `background:${c.quoteBg}`,
        `border-left:4px solid ${c.quoteBorder}`,
        `border-radius:0 4px 4px 0`,
        `color:${c.text}`
      ]);
      break;
    case "pre": {
      const codeText = el.textContent || "";
      const lines = codeText.split("\n");
      const codeEl = el.querySelector("code");
      let lang = "";
      if (codeEl) {
        const cls = codeEl.className || "";
        const langMatch = cls.match(/language-(\w+)/);
        if (langMatch) lang = langMatch[1];
      }
      const wrapper = doc.createElement("div");
      setStyle(wrapper, [
        `background: ${c.codeBg}`,
        `color: ${c.codeText}`,
        `border-radius: 4px`,
        `overflow: hidden`,
        `margin: 1.5em 0`
      ]);
      if (lang) {
        const langP = doc.createElement("p");
        langP.textContent = lang;
        setStyle(langP, [
          `background: ${c.codeBg}`,
          `color: ${c.codeText}`,
          `margin: 0`,
          `padding: 12px 16px 4px 16px`,
          `font-family:'Courier New','Consolas',monospace`,
          `font-size:0.75em`,
          `line-height: 1.5`,
          `opacity: 0.7`,
          `border-radius: 4px 4px 0 0`,
          `text-align: right`
        ]);
        wrapper.appendChild(langP);
      }
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineP = doc.createElement("p");
        lineP.textContent = line || "\xA0";
        const baseStyles = [
          `background: ${c.codeBg}`,
          `color: ${c.codeText}`,
          `margin: 0`,
          `padding: 0 16px`,
          `font-family:'Courier New','Consolas',monospace`,
          `font-size:0.9em`,
          `line-height: 1.5`,
          `word-break: break-all`
        ];
        if (i === 0 && !lang) {
          baseStyles[3] = `padding: 12px 16px 0 16px`;
          baseStyles.push(`border-radius: 4px 4px 0 0`);
        }
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
    case "code":
      if (el.parentElement?.tagName !== "PRE") {
        setStyle(el, [
          `font-family:'Courier New','Consolas',monospace`,
          `background:${c.codeBg}`,
          `color:${c.codeText}`,
          `padding:2px 6px`,
          `border-radius:3px`,
          `font-size:0.9em`
        ]);
      }
      break;
    case "table": {
      const wrapper = doc.createElement("div");
      setStyle(wrapper, [`overflow-x:auto`, `margin:1em 0`]);
      el.parentNode?.insertBefore(wrapper, el);
      wrapper.appendChild(el);
      setStyle(el, [
        `width:100%`,
        `border-collapse:collapse`,
        `font-size:0.95em`,
        `border:1px solid ${c.tableBorder}`
      ]);
      const ths = el.querySelectorAll("th");
      ths.forEach((th) => setStyle(th, [
        `background:${c.tableHeader}`,
        `color:#ffffff`,
        `padding:10px 12px`,
        `font-weight:600`,
        `border:1px solid ${c.tableBorder}`,
        `text-align:left`
      ]));
      const tds = el.querySelectorAll("td");
      tds.forEach((td) => setStyle(td, [
        `padding:8px 12px`,
        `border:1px solid ${c.tableBorder}`,
        `text-align:left`
      ]));
      const rows = el.querySelectorAll("tr");
      rows.forEach((row, idx) => {
        if (idx % 2 === 1) {
          row.querySelectorAll("td").forEach((td) => {
            setStyle(td, [`background:${c.tableAlt}`]);
          });
        }
      });
      break;
    }
    case "ul":
      setStyle(el, [`padding:0`, `margin:0.8em 0`, `list-style:none`]);
      break;
    case "ol":
      setStyle(el, [`padding:0`, `margin:0.8em 0`, `list-style:none`]);
      break;
    case "li": {
      const parent = el.parentElement;
      const isOrdered = parent?.tagName === "OL";
      let depth = 0;
      let p = el.parentElement;
      while (p) {
        if (p.tagName === "UL" || p.tagName === "OL") depth++;
        p = p.parentElement;
      }
      let marker;
      if (isOrdered) {
        marker = `${el.getAttribute("data-li-index") || "1"}.`;
      } else {
        marker = "\u2022";
        if (depth > 1) marker = "\u25E6";
        if (depth > 2) marker = "\u25AA";
      }
      const markerEl = doc.createElement("span");
      markerEl.textContent = marker;
      setStyle(markerEl, [
        `display:inline-block`,
        `padding-right:0.5em`,
        `color:${c.primary}`,
        `font-weight:${isOrdered ? "600" : "normal"}`
      ]);
      const pChild = el.querySelector(":scope > p");
      if (pChild) {
        while (pChild.firstChild) {
          el.insertBefore(pChild.firstChild, pChild);
        }
        el.removeChild(pChild);
      }
      el.insertBefore(markerEl, el.firstChild);
      const pEl = doc.createElement("p");
      while (el.firstChild) {
        pEl.appendChild(el.firstChild);
      }
      setStyle(pEl, [
        `margin:0`,
        `padding-left:${(depth - 1) * 1.5}em`
      ]);
      el.parentNode?.replaceChild(pEl, el);
      break;
    }
    case "hr":
      setStyle(el, [
        `border:none`,
        `border-top:1px dashed ${c.border}`,
        `margin:1.5em 0`
      ]);
      break;
    case "img": {
      const src = el.getAttribute("src") || "";
      const alt = el.getAttribute("alt") || "";
      const width = settings.imageWidth;
      const container = doc.createElement("div");
      setStyle(container, [`text-align:center`, `margin:1em 0`]);
      el.parentNode?.insertBefore(container, el);
      container.appendChild(el);
      setStyle(el, [
        `max-width:${width}`,
        `height:auto`,
        `border-radius:4px`
      ]);
      if (alt) {
        const caption = doc.createElement("br");
        container.appendChild(caption);
        const capSpan = doc.createElement("span");
        capSpan.textContent = alt;
        setStyle(capSpan, [`color:#999`, `font-size:0.85em`]);
        container.appendChild(capSpan);
      }
      break;
    }
    case "strong":
      setStyle(el, [`font-weight:700`, `color:${c.heading}`]);
      break;
    case "a":
      setStyle(el, [`color:${c.primary}`, `text-decoration:none`]);
      break;
  }
}
function setStyle(el, styles) {
  if (!el || !styles.length) return;
  const existing = el.getAttribute("style") || "";
  const addon = styles.join(";");
  el.setAttribute("style", existing ? existing + ";" + addon : addon);
}
function headingStyle(c, tag, isMajor) {
  const sizes = {
    h1: "1.6em",
    h2: "1.35em",
    h3: "1.2em",
    h4: "1.1em",
    h5: "1em",
    h6: "0.95em"
  };
  const size = sizes[tag] || "1.2em";
  const styles = [
    `margin:1.2em 0 0.6em 0`,
    `font-size:${size}`,
    `font-weight:700`,
    `color:${c.heading}`,
    `line-height:1.4`
  ];
  if (isMajor) {
    styles.push(`border-left:4px solid ${c.primary}`);
    styles.push(`padding-left:12px`);
  } else {
    styles.push(`border-bottom:2px solid ${c.border}`);
    styles.push(`padding-bottom:6px`);
  }
  return styles;
}
function paragraphStyle(c, settings) {
  const styles = [
    `margin:0`,
    `margin-bottom:1em`
  ];
  if (settings.autoIndent) {
    styles.push(`text-indent:${settings.indentSize}em`);
  }
  return styles;
}
var WeChatApi = class {
  appId;
  appSecret;
  thumbMediaId;
  accessToken = null;
  tokenExpiry = 0;
  constructor(appId, appSecret, thumbMediaId = "") {
    this.appId = appId;
    this.appSecret = appSecret;
    this.thumbMediaId = thumbMediaId;
  }
  updateCredentials(appId, appSecret, thumbMediaId = "") {
    this.appId = appId;
    this.appSecret = appSecret;
    this.thumbMediaId = thumbMediaId;
    this.accessToken = null;
    this.tokenExpiry = 0;
  }
  isConfigured() {
    return this.appId.length > 0 && this.appSecret.length > 0;
  }
  async ensureToken() {
    const now = Date.now();
    if (this.accessToken && now < this.tokenExpiry) {
      return this.accessToken;
    }
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(this.appId)}&secret=${encodeURIComponent(this.appSecret)}`;
    const resp = await requestUrl({ url });
    const data = resp.json;
    if (data.errcode || !data.access_token) {
      throw new Error(`\u83B7\u53D6 access_token \u5931\u8D25: ${data.errmsg || "\u672A\u77E5\u9519\u8BEF"} (code: ${data.errcode})`);
    }
    this.accessToken = data.access_token;
    this.tokenExpiry = now + ((data.expires_in || 7200) - 300) * 1e3;
    return this.accessToken;
  }
  /**
   * Upload a default cover image (900×500 gray PNG) to WeChat material library.
   * Returns the media_id on success. Does NOT cache — caller should persist it.
   */
  async uploadDefaultThumbnail() {
    const token = await this.ensureToken();
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 500;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#888888";
    ctx.fillRect(0, 0, 900, 500);
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error("Failed to create PNG from canvas"));
      }, "image/png");
    });
    const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${encodeURIComponent(token)}&type=image`;
    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).slice(2, 12);
    const headerStr = `--${boundary}\r
Content-Disposition: form-data; name="media"; filename="thumb.png"\r
Content-Type: image/png\r
\r
`;
    const footerStr = `\r
--${boundary}--\r
`;
    const headerBlob = new Blob([headerStr]);
    const footerBlob = new Blob([footerStr]);
    const fullBodyBlob = new Blob([headerBlob, blob, footerBlob]);
    const bodyBuffer = await fullBodyBlob.arrayBuffer();
    const resp = await requestUrl({
      url,
      method: "POST",
      contentType: `multipart/form-data; boundary=${boundary}`,
      body: bodyBuffer
    });
    const data = resp.json;
    if (data.errcode) {
      throw new Error(`\u4E0A\u4F20\u5C01\u9762\u5931\u8D25: ${data.errmsg} (code: ${data.errcode})`);
    }
    this.thumbMediaId = data.media_id;
    return data.media_id;
  }
  /**
   * Strip emoji and WeChat-rejected Unicode from HTML content
   * to avoid "invalid content hint" (code: 45166) on draft add.
   */
  stripEmoji(str) {
    return str.replace(/\p{Extended_Pictographic}/gu, "").replace(/[\uFE00-\uFE0F]/g, "").replace(/\u200D/g, "").replace(/\u20E3/g, "").replace(/\p{Emoji_Modifier}/gu, "").replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "").replace(/[\u{1F3FB}-\u{1F3FF}]/gu, "").replace(/\p{Default_Ignorable_Code_Point}/gu, "").replace(/\s{2,}/g, " ").trim();
  }
  /**
   * Lightweight sanitization for title/digest plain text.
   * Only strips emoji and control characters — does NOT apply the aggressive
   * cleanup (step 7) that is only needed for HTML content.
   */
  sanitizeTitle(str) {
    let result = this.stripEmoji(str);
    result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u200B-\u200F\u2028-\u202F\uFEFF]/g, "");
    result = result.replace(/\s{3,}/g, " ").trim();
    if (result.length === 0) {
      result = "\u65E0\u6807\u9898";
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
  sanitizeForWeChat(str) {
    let result = this.stripEmoji(str);
    result = result.replace(/<img[^>]*src\s*=\s*["']app:\/\/[^"']*["'][^>]*>/gi, '<span style="color:#999;font-size:0.9em;">[\u56FE\u7247\u4E0A\u4F20\u5931\u8D25]</span>');
    result = result.replace(/<img[^>]*src\s*=\s*["']file:\/\/\/[^"']*["'][^>]*>/gi, '<span style="color:#999;font-size:0.9em;">[\u56FE\u7247\u4E0A\u4F20\u5931\u8D25]</span>');
    result = result.replace(/<\/?(?:script|iframe|object|embed|applet|frame|frameset|form|input|button|select|textarea|style|link|meta|html|head|body|title|base|noscript|template)[^>]*>/gi, "");
    result = result.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*')/gi, "");
    result = result.replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, 'href=""');
    result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u200B-\u200F\u2028-\u202F\uFEFF\u00A0]/g, "");
    result = result.replace(/<!--[\s\S]*?-->/g, "");
    result = result.replace(/src="data:image\/[^"]{500,}"/gi, 'src=""');
    result = result.replace(
      /[^\x20-\x7E\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3000-\u303F\uFF00-\uFFEF\u2000-\u206F\u2100-\u214F\n\r	]/g,
      ""
    ).replace(/\n{3,}/g, "\n\n").trim();
    if (result.length > 2e5) {
      result = result.substring(0, 199997) + "...";
    }
    if (result.trim().length === 0) {
      result = "<p></p>";
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
  async uploadImage(imageData, filename = "image.jpg", mimeType = "image/jpeg") {
    const token = await this.ensureToken();
    const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${encodeURIComponent(token)}&type=image`;
    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).slice(2, 12);
    const headerStr = `--${boundary}\r
Content-Disposition: form-data; name="media"; filename="${filename}"\r
Content-Type: ${mimeType}\r
\r
`;
    const footerStr = `\r
--${boundary}--\r
`;
    const headerBlob = new Blob([headerStr]);
    const bodyBlob = new Blob([imageData]);
    const footerBlob = new Blob([footerStr]);
    const fullBodyBlob = new Blob([headerBlob, bodyBlob, footerBlob]);
    const bodyBuffer = await fullBodyBlob.arrayBuffer();
    const resp = await requestUrl({
      url,
      method: "POST",
      contentType: `multipart/form-data; boundary=${boundary}`,
      body: bodyBuffer
    });
    const data = resp.json;
    if (data.errcode) {
      throw new Error(`\u4E0A\u4F20\u56FE\u7247\u5931\u8D25: ${data.errmsg} (code: ${data.errcode})`);
    }
    return { url: data.url, media_id: data.media_id };
  }
  async createDraft(title, content, author, digest) {
    const token = await this.ensureToken();
    if (!this.thumbMediaId) {
      throw new Error(
        "\u7F3A\u5C11\u5C01\u9762\u56FE\u7247 MediaID\u3002\n\u8BF7\u5148\u5728\u516C\u4F17\u53F7\u540E\u53F0\u300C\u7D20\u6750\u5E93\u300D\u4E0A\u4F20\u5C01\u9762\u56FE\uFF0C\u5C06\u5F97\u5230\u7684 media_id \u586B\u5165\u63D2\u4EF6\u8BBE\u7F6E\u300C\u5C01\u9762\u56FE\u7247 MediaID\u300D\u3002\n\u4E5F\u53EF\u5728\u63D2\u4EF6\u8BBE\u7F6E\u4E2D\u70B9\u51FB\u300C\u4E0A\u4F20\u9ED8\u8BA4\u5C01\u9762\u300D\u81EA\u52A8\u751F\u6210\u5E76\u4FDD\u5B58\u3002"
      );
    }
    const safeTitle = this.sanitizeTitle(title);
    const safeDigest = this.sanitizeTitle(digest);
    let safeContent = this.sanitizeForWeChat(content);
    try {
      const app = globalThis.app;
      if (app?.vault) {
        const debugPath = `.obsidian/plugins/obsidian-wechat-format/debug-payload.json`;
        await app.vault.adapter.write(debugPath, JSON.stringify({
          titleLen: safeTitle.length,
          contentLen: safeContent.length,
          digestLen: safeDigest.length,
          thumbMediaId: this.thumbMediaId?.substring(0, 8) + "...",
          titlePreview: safeTitle.substring(0, 60),
          contentPreview: safeContent.substring(0, 200),
          nonAsciiInContent: [...safeContent].filter((c) => c.codePointAt(0) > 127).join("")
        }, null, 2));
      }
    } catch (_) {
    }
    console.log("[WeChat Format] createDraft payload:", {
      titleLen: safeTitle.length,
      contentLen: safeContent.length,
      digestLen: safeDigest.length,
      titlePreview: safeTitle.substring(0, 60),
      contentPreview: safeContent.substring(0, 100)
    });
    const article = {
      title: safeTitle,
      author: this.sanitizeForWeChat(author),
      digest: safeDigest,
      content: safeContent,
      content_source_url: "",
      need_open_comment: 0,
      only_fans_can_comment: 0,
      thumb_media_id: this.thumbMediaId
    };
    const body = { articles: [article] };
    const resp = await requestUrl({
      url: `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${encodeURIComponent(token)}`,
      method: "POST",
      contentType: "application/json",
      body: JSON.stringify(body)
    });
    const data = resp.json;
    if (data.errcode === void 0) {
      return data;
    }
    if (data.errcode !== 0) {
      throw new Error(`\u521B\u5EFA\u8349\u7A3F\u5931\u8D25: ${data.errmsg || "\u672A\u77E5\u9519\u8BEF"} (code: ${data.errcode})`);
    }
    return data;
  }
};
var WeChatFormatSettingTab = class extends PluginSettingTab {
  plugin;
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "WeChat Format \u2014 \u516C\u4F17\u53F7\u6392\u7248\u8BBE\u7F6E" });
    new Setting(containerEl).setName("\u6392\u7248\u4E3B\u9898").setDesc("\u9009\u62E9\u6587\u7AE0\u7684\u6574\u4F53\u89C6\u89C9\u98CE\u683C").addDropdown((dd) => {
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
      containerEl.createEl("p", {
        text: themeDesc.description,
        attr: { style: "margin:-10px 0 20px 14px;color:#888;font-size:13px;" }
      });
    }
    new Setting(containerEl).setName("\u6B63\u6587\u5B57\u53F7").setDesc("\u6587\u7AE0\u6B63\u6587\u7684\u5B57\u4F53\u5927\u5C0F").addDropdown((dd) => {
      ["14px", "15px", "16px", "17px", "18px"].forEach((s) => dd.addOption(s, s));
      dd.setValue(this.plugin.settings.fontSize);
      dd.onChange(async (v) => {
        this.plugin.settings.fontSize = v;
        await this.plugin.saveSettings();
        this.plugin.refreshPreview();
      });
    });
    new Setting(containerEl).setName("\u884C\u9AD8").setDesc("\u6B63\u6587\u884C\u95F4\u8DDD\u500D\u6570").addDropdown((dd) => {
      ["1.5", "1.6", "1.75", "1.8", "2.0"].forEach((s) => dd.addOption(s, s));
      dd.setValue(this.plugin.settings.lineHeight);
      dd.onChange(async (v) => {
        this.plugin.settings.lineHeight = v;
        await this.plugin.saveSettings();
        this.plugin.refreshPreview();
      });
    });
    new Setting(containerEl).setName("\u56FE\u7247\u6700\u5927\u5BBD\u5EA6").setDesc("\u6587\u7AE0\u4E2D\u56FE\u7247\u7684\u6700\u5927\u5BBD\u5EA6").addDropdown((dd) => {
      ["80%", "90%", "100%"].forEach((s) => dd.addOption(s, s));
      dd.setValue(this.plugin.settings.imageWidth);
      dd.onChange(async (v) => {
        this.plugin.settings.imageWidth = v;
        await this.plugin.saveSettings();
        this.plugin.refreshPreview();
      });
    });
    new Setting(containerEl).setName("\u9996\u884C\u7F29\u8FDB").setDesc("\u662F\u5426\u81EA\u52A8\u4E3A\u6BB5\u843D\u6DFB\u52A0\u9996\u884C\u7F29\u8FDB").addToggle((t) => {
      t.setValue(this.plugin.settings.autoIndent);
      t.onChange(async (v) => {
        this.plugin.settings.autoIndent = v;
        await this.plugin.saveSettings();
        this.plugin.refreshPreview();
      });
    });
    new Setting(containerEl).setName("\u7F29\u8FDB\u5927\u5C0F").setDesc("\u9996\u884C\u7F29\u8FDB\u7684\u5B57\u7B26\u6570\uFF08em\uFF09").addSlider((s) => {
      s.setLimits(1, 4, 0.5);
      s.setValue(this.plugin.settings.indentSize);
      s.setDynamicTooltip();
      s.onChange(async (v) => {
        this.plugin.settings.indentSize = v;
        await this.plugin.saveSettings();
        this.plugin.refreshPreview();
      });
    });
    containerEl.createEl("hr", { attr: { style: "margin:20px 0;" } });
    containerEl.createEl("h3", { text: "\u{1F4DD} \u81EA\u5B9A\u4E49\u5F15\u8A00\uFF08\u53EF\u9009\uFF09" });
    new Setting(containerEl).setName("\u542F\u7528\u5F15\u8A00").setDesc("\u5728\u6587\u7AE0\u6807\u9898\u4E0B\u65B9\u663E\u793A\u4E00\u6BB5\u5F15\u8A00\u6587\u5B57").addToggle((t) => {
      t.setValue(this.plugin.settings.enableQuote);
      t.onChange(async (v) => {
        this.plugin.settings.enableQuote = v;
        await this.plugin.saveSettings();
        this.display();
        this.plugin.refreshPreview();
      });
    });
    if (this.plugin.settings.enableQuote) {
      new Setting(containerEl).setName("\u5F15\u8A00\u5185\u5BB9").setDesc("\u663E\u793A\u5728\u6587\u7AE0\u5F00\u5934\u7684\u5F15\u7528\u6587\u5B57").addTextArea((t) => {
        t.setValue(this.plugin.settings.quoteText);
        t.inputEl.style.width = "100%";
        t.inputEl.style.minHeight = "60px";
        t.onChange(async (v) => {
          this.plugin.settings.quoteText = v;
          await this.plugin.saveSettings();
          this.plugin.refreshPreview();
        });
      });
      new Setting(containerEl).setName("\u5F15\u8A00\u4F5C\u8005\uFF08\u53EF\u9009\uFF09").setDesc("\u663E\u793A\u5728\u5F15\u8A00\u53F3\u4E0B\u65B9\u7684\u7F72\u540D").addText((t) => {
        t.setPlaceholder("\u4F8B\u5982\uFF1A\u67D0\u67D0\u67D0");
        t.setValue(this.plugin.settings.quoteAuthor);
        t.onChange(async (v) => {
          this.plugin.settings.quoteAuthor = v;
          await this.plugin.saveSettings();
          this.plugin.refreshPreview();
        });
      });
      new Setting(containerEl).setName("\u5F15\u8A00\u5B57\u53F7").setDesc("\u5F15\u8A00\u6587\u5B57\u7684\u5B57\u53F7\u5927\u5C0F").addDropdown((dd) => {
        ["14px", "15px", "16px", "17px", "18px", "19px", "20px"].forEach((s) => dd.addOption(s, s));
        dd.setValue(this.plugin.settings.quoteFontSize);
        dd.onChange(async (v) => {
          this.plugin.settings.quoteFontSize = v;
          await this.plugin.saveSettings();
          this.plugin.refreshPreview();
        });
      });
    }
    containerEl.createEl("hr", { attr: { style: "margin:20px 0;" } });
    containerEl.createEl("h3", { text: "\u{1F4E6} \u5E95\u90E8\u5173\u6CE8\u533A" });
    new Setting(containerEl).setName("\u5E95\u90E8\u5173\u6CE8\u533A").setDesc("\u5728\u6587\u7AE0\u5E95\u90E8\u6DFB\u52A0\u626B\u7801\u5173\u6CE8\u3001\u5F80\u671F\u5185\u5BB9\u7B49\u56FA\u5B9A\u6CE8\u91CA\u6587\u5B57").addToggle((t) => {
      t.setValue(this.plugin.settings.addQrCode);
      t.onChange(async (v) => {
        this.plugin.settings.addQrCode = v;
        await this.plugin.saveSettings();
        this.plugin.refreshPreview();
      });
    });
    new Setting(containerEl).setName("\u5173\u6CE8\u5F15\u5BFC\u6587\u5B57").setDesc("\u5E95\u90E8\u5173\u6CE8\u7684\u63D0\u793A\u6587\u6848").addText((t) => {
      t.setValue(this.plugin.settings.qrCodeText);
      t.onChange(async (v) => {
        this.plugin.settings.qrCodeText = v;
        await this.plugin.saveSettings();
        this.plugin.refreshPreview();
      });
    });
    new Setting(containerEl).setName("\u5173\u6CE8\u533A\u5B57\u53F7").setDesc("\u5E95\u90E8\u5173\u6CE8\u5F15\u5BFC\u6587\u5B57\u7684\u5B57\u53F7\u5927\u5C0F").addDropdown((dd) => {
      ["14px", "15px", "16px", "17px", "18px", "19px", "20px"].forEach((s) => dd.addOption(s, s));
      dd.setValue(this.plugin.settings.qrCodeFontSize);
      dd.onChange(async (v) => {
        this.plugin.settings.qrCodeFontSize = v;
        await this.plugin.saveSettings();
        this.plugin.refreshPreview();
      });
    });
    containerEl.createEl("hr", { attr: { style: "margin:20px 0;" } });
    containerEl.createEl("h3", { text: "\u{1F511} \u516C\u4F17\u53F7 API \u8BBE\u7F6E\uFF08\u53D1\u9001\u5230\u8349\u7A3F\u7BB1\uFF09" });
    new Setting(containerEl).setName("AppID").setDesc("\u5FAE\u4FE1\u516C\u4F17\u53F7\u540E\u53F0 \u2192 \u8BBE\u7F6E\u4E0E\u5F00\u53D1 \u2192 \u57FA\u672C\u914D\u7F6E \u2192 AppID").addText((t) => {
      t.setPlaceholder("wx...");
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
    new Setting(containerEl).setName("AppSecret").setDesc("\u5FAE\u4FE1\u516C\u4F17\u53F7\u540E\u53F0 \u2192 \u8BBE\u7F6E\u4E0E\u5F00\u53D1 \u2192 \u57FA\u672C\u914D\u7F6E \u2192 AppSecret").addText((t) => {
      t.setPlaceholder("\u8BF7\u586B\u5199 AppSecret");
      t.inputEl.type = "password";
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
    new Setting(containerEl).setName("\u6587\u7AE0\u4F5C\u8005").setDesc("\u663E\u793A\u5728\u516C\u4F17\u53F7\u6587\u7AE0\u4F5C\u8005\u680F\u7684\u540D\u79F0").addText((t) => {
      t.setPlaceholder("\u516C\u4F17\u53F7");
      t.setValue(this.plugin.settings.author);
      t.onChange(async (v) => {
        this.plugin.settings.author = v;
        await this.plugin.saveSettings();
      });
    });
    new Setting(containerEl).setName("\u5C01\u9762\u56FE\u7247 MediaID").setDesc("\u5FC5\u586B\u3002\u516C\u4F17\u53F7\u8349\u7A3F\u5FC5\u987B\u8BBE\u7F6E\u5C01\u9762\u56FE\uFF1A\u5728\u540E\u53F0\u300C\u7D20\u6750\u5E93\u300D\u4E0A\u4F20\u5C01\u9762\u56FE\u540E\uFF0C\u5C06\u5F97\u5230\u7684 media_id \u7C98\u8D34\u81F3\u6B64").addText((t) => {
      t.setPlaceholder("\u8BF7\u586B\u5199\u5C01\u9762\u56FE\u7247\u7684 media_id");
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
    new Setting(containerEl).setName("\u4E0A\u4F20\u9ED8\u8BA4\u5C01\u9762").setDesc("\u81EA\u52A8\u751F\u6210 900\xD7500 \u7070\u8272\u5C01\u9762\u56FE\u7247\u5E76\u4E0A\u4F20\u5230\u516C\u4F17\u53F7\u7D20\u6750\u5E93\uFF0Cmedia_id \u4F1A\u81EA\u52A8\u4FDD\u5B58\u5230\u8BBE\u7F6E").addButton((btn) => {
      btn.setButtonText("\u4E0A\u4F20\u9ED8\u8BA4\u5C01\u9762");
      btn.setCta();
      btn.onClick(async () => {
        btn.setDisabled(true);
        btn.setButtonText("\u4E0A\u4F20\u4E2D...");
        try {
          if (!this.plugin.wechatApi.isConfigured()) {
            throw new Error("\u8BF7\u5148\u586B\u5199 AppID \u548C AppSecret");
          }
          const mediaId = await this.plugin.wechatApi.uploadDefaultThumbnail();
          this.plugin.settings.thumbMediaId = mediaId;
          await this.plugin.saveSettings();
          this.plugin.wechatApi.updateCredentials(
            this.plugin.settings.appId,
            this.plugin.settings.appSecret,
            mediaId
          );
          new Notice(`\u2705 \u4E0A\u4F20\u6210\u529F\uFF01media_id: ${mediaId}`);
          this.display();
        } catch (err) {
          new Notice(`\u274C \u4E0A\u4F20\u5931\u8D25: ${err.message}`, 8e3);
        } finally {
          btn.setDisabled(false);
          btn.setButtonText("\u4E0A\u4F20\u9ED8\u8BA4\u5C01\u9762");
        }
      });
    });
    new Setting(containerEl).setName("\u4ECE\u5E93\u9009\u62E9\u5C01\u9762\u56FE\u7247").setDesc("\u4ECE Obsidian \u5E93\u4E2D\u9009\u62E9\u4E00\u5F20\u56FE\u7247\u4F5C\u4E3A\u5C01\u9762\u5E76\u4E0A\u4F20\u5230\u7D20\u6750\u5E93").addButton((btn) => {
      btn.setButtonText("\u9009\u62E9\u56FE\u7247...");
      btn.setCta();
      btn.onClick(async () => {
        new CoverFileSuggestModal(this.plugin.app, this.plugin).open();
      });
    });
    new Setting(containerEl).setName("\u4ECE\u526A\u8D34\u677F\u7C98\u8D34\u5C01\u9762").setDesc("\u5C06\u526A\u8D34\u677F\u4E2D\u7684\u56FE\u7247\u76F4\u63A5\u4E0A\u4F20\u5230\u7D20\u6750\u5E93\u4F5C\u4E3A\u5C01\u9762\uFF08\u652F\u6301\u622A\u56FE\u7C98\u8D34\uFF09").addButton((btn) => {
      btn.setButtonText("\u4ECE\u526A\u8D34\u677F\u7C98\u8D34");
      btn.setCta();
      btn.onClick(async () => {
        try {
          btn.setDisabled(true);
          btn.setButtonText("\u5904\u7406\u4E2D...");
          const clipboardItems = await navigator.clipboard.read();
          let imageFound = false;
          for (const item of clipboardItems) {
            for (const type of item.types) {
              if (type.startsWith("image/")) {
                const blob = await item.getType(type);
                const arrayBuffer = await blob.arrayBuffer();
                const ext = type.split("/")[1] || "png";
                new Notice("\u{1F4E4} \u6B63\u5728\u4E0A\u4F20\u526A\u8D34\u677F\u5C01\u9762...");
                const result = await this.plugin.wechatApi.uploadImage(arrayBuffer, `clipboard.${ext}`, type);
                this.plugin.settings.thumbMediaId = result.media_id;
                await this.plugin.saveSettings();
                this.plugin.wechatApi.updateCredentials(
                  this.plugin.settings.appId,
                  this.plugin.settings.appSecret,
                  result.media_id
                );
                new Notice(`\u2705 \u526A\u8D34\u677F\u5C01\u9762\u4E0A\u4F20\u6210\u529F\uFF01media_id: ${result.media_id}`);
                this.display();
                imageFound = true;
                break;
              }
            }
            if (imageFound) break;
          }
          if (!imageFound) {
            new Notice("\u26A0\uFE0F \u526A\u8D34\u677F\u4E2D\u6CA1\u6709\u627E\u5230\u56FE\u7247");
          }
        } catch (e) {
          new Notice(`\u274C \u526A\u8D34\u677F\u8BFB\u53D6\u5931\u8D25: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
          btn.setDisabled(false);
          btn.setButtonText("\u4ECE\u526A\u8D34\u677F\u7C98\u8D34");
        }
      });
    });
    containerEl.createEl("hr", { attr: { style: "margin:20px 0;" } });
    containerEl.createEl("h3", { text: "\u4F7F\u7528\u8BF4\u660E" });
    const help = containerEl.createEl("div", {
      attr: { style: "background:#f8f8f8;padding:16px;border-radius:8px;font-size:13px;line-height:1.7;color:#555;" }
    });
    help.innerHTML = `
			<p><b>\u{1F4D6} \u4F7F\u7528\u65B9\u6CD5\uFF1A</b></p>
			<ol style="padding-left:1.5em;">
				<li>\u5728 Obsidian \u4E2D\u6253\u5F00\u8981\u6392\u7248\u7684\u7B14\u8BB0</li>
				<li>\u6309 <code>Ctrl+P</code>\uFF08Mac: <code>Cmd+P</code>\uFF09\u2192 \u641C\u7D22 "WeChat Format"</li>
				<li>\u6392\u7248\u540E\u7C98\u8D34\u5230\u516C\u4F17\u53F7\u7F16\u8F91\u5668\u5373\u53EF</li>
			</ol>
			<p><b>\u{1F4E4} \u53D1\u9001\u5230\u516C\u4F17\u53F7\u8349\u7A3F\u7BB1\uFF1A</b></p>
			<ol style="padding-left:1.5em;">
				<li>\u5148\u5728 <b>\u{1F511} \u516C\u4F17\u53F7 API \u8BBE\u7F6E</b> \u4E2D\u586B\u5199 AppID \u548C AppSecret</li>
				<li>\u70B9\u51FB <b>\u4E0A\u4F20\u9ED8\u8BA4\u5C01\u9762</b> \u6309\u94AE\u81EA\u52A8\u751F\u6210\u5C01\u9762\u56FE\uFF08\u516C\u4F17\u53F7\u8349\u7A3F\u5FC5\u987B\u8BBE\u7F6E\u5C01\u9762\uFF09</li>
				<li>\u6309 <code>Ctrl+P</code> \u2192 \u641C\u7D22 "\u{1F4E4} \u53D1\u9001\u5230\u516C\u4F17\u53F7\u8349\u7A3F\u7BB1"</li>
				<li>\u6587\u7AE0\u6807\u9898\u81EA\u52A8\u53D6\u81EA\u7B2C\u4E00\u4E2A <code># \u6807\u9898</code>\uFF0C\u6458\u8981\u53D6\u81EA\u9996\u6BB5</li>
			</ol>
			<p><b>\u{1F4A1} \u9884\u89C8\u9762\u677F</b>\u4F1A\u968F\u539F\u7A3F\u53D8\u5316\u81EA\u52A8\u5237\u65B0\uFF0C\u9876\u90E8\u53EF\u5207\u4E3B\u9898\u6216\u76F4\u63A5\u53D1\u9001\u5230\u8349\u7A3F\u7BB1</p>
			<p><b>\u26A0\uFE0F \u6CE8\u610F\uFF1A</b>\u56FE\u7247\u9700\u5148\u4E0A\u4F20\u5230\u516C\u4F17\u53F7\u7D20\u6750\u5E93\uFF0C\u518D\u66FF\u6362\u94FE\u63A5\u3002API \u51ED\u8BC1\u4EC5\u4FDD\u5B58\u5728\u672C\u5730</p>
		`;
    const status = containerEl.createEl("div", {
      attr: { style: "margin-top:16px;padding:12px;border-radius:8px;font-size:13px;background:#f0f8ff;border:1px solid #d0e8ff;" }
    });
    const configured = this.plugin.settings.appId && this.plugin.settings.appSecret;
    status.innerHTML = configured ? `<b>\u2705 \u516C\u4F17\u53F7 API \u72B6\u6001\uFF1A</b>\u5DF2\u914D\u7F6E\uFF08AppID: ${this.plugin.settings.appId.substring(0, 8)}...\uFF09` : `<b>\u26A0\uFE0F \u516C\u4F17\u53F7 API \u72B6\u6001\uFF1A</b>\u672A\u914D\u7F6E\uFF0C\u8BF7\u586B\u5199 AppID \u548C AppSecret`;
  }
};
var CoverFileSuggestModal = class extends SuggestModal {
  plugin;
  imageFiles;
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.imageFiles = app.vault.getFiles().filter(
      (f) => /\.(png|jpe?g|gif|webp|bmp)$/i.test(f.name)
    );
    this.setPlaceholder("\u641C\u7D22\u56FE\u7247\u6587\u4EF6...");
    this.limit = 20;
  }
  getSuggestions(query) {
    const q = query.toLowerCase();
    return this.imageFiles.filter(
      (f) => f.path.toLowerCase().includes(q)
    );
  }
  renderSuggestion(file, el) {
    el.createEl("div", { text: file.path });
  }
  async onChooseSuggestion(file) {
    try {
      new Notice(`\u{1F4E4} \u6B63\u5728\u4E0A\u4F20\u5C01\u9762: ${file.name}`);
      const arrayBuffer = await this.app.vault.readBinary(file);
      const ext = file.extension.toLowerCase();
      const mimeTypes = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp",
        "bmp": "image/bmp"
      };
      const result = await this.plugin.wechatApi.uploadImage(arrayBuffer, file.name, mimeTypes[ext] || "image/jpeg");
      this.plugin.settings.thumbMediaId = result.media_id;
      await this.plugin.saveSettings();
      this.plugin.wechatApi.updateCredentials(
        this.plugin.settings.appId,
        this.plugin.settings.appSecret,
        result.media_id
      );
      new Notice(`\u2705 \u5C01\u9762\u4E0A\u4F20\u6210\u529F\uFF01media_id: ${result.media_id}`);
    } catch (e) {
      new Notice(`\u274C \u5C01\u9762\u4E0A\u4F20\u5931\u8D25: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
};
var WECHAT_PREVIEW_VIEW = "wechat-preview-view";
var WeChatPreviewView = class extends ItemView {
  source;
  plugin;
  debounceTimer = null;
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  getViewType() {
    return WECHAT_PREVIEW_VIEW;
  }
  getDisplayText() {
    return "WeChat Preview";
  }
  getIcon() {
    return "file-text";
  }
  async onOpen() {
    this.containerEl.empty();
    this.containerEl.setAttribute(
      "style",
      "height:100%;display:flex;flex-direction:column;overflow:hidden;"
    );
    const toolbar = this.containerEl.createEl("div", {
      attr: {
        style: "flex-shrink:0;display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:10px;background:#f5f5f5;border-radius:6px;"
      }
    });
    toolbar.createEl("span", { text: "\u4E3B\u9898: ", attr: { style: "font-size:13px;font-weight:500;" } });
    const themeSelect = toolbar.createEl("select", {
      attr: { style: "padding:4px 8px;border-radius:4px;border:1px solid #ddd;font-size:13px;" }
    });
    for (const [key, theme] of Object.entries(THEMES)) {
      const opt = themeSelect.createEl("option", { value: key, text: theme.label });
      if (key === this.plugin.settings.theme) opt.selected = true;
    }
    themeSelect.addEventListener("change", () => {
      this.plugin.settings.theme = themeSelect.value;
      this.plugin.saveSettings();
      this.refreshNow();
    });
    toolbar.createEl("span", { text: " ", attr: { style: "flex:1;" } });
    const copyBtn = toolbar.createEl("button", {
      text: "\u{1F4CB} \u590D\u5236",
      attr: {
        style: "padding:6px 14px;border-radius:4px;border:1px solid #ddd;background:#fff;cursor:pointer;font-size:13px;"
      }
    });
    copyBtn.addEventListener("click", () => this.plugin.formatToClipboard());
    const sendBtn = toolbar.createEl("button", {
      text: "\u{1F4E4} \u53D1\u9001\u8349\u7A3F",
      attr: {
        style: "padding:6px 14px;border-radius:4px;border:1px solid #27ae60;background:#27ae60;color:#fff;cursor:pointer;font-size:13px;"
      }
    });
    sendBtn.addEventListener("click", () => this.plugin.sendToDraft());
    const refreshBtn = toolbar.createEl("button", {
      text: "\u{1F504} \u5237\u65B0",
      attr: {
        style: "padding:6px 14px;border-radius:4px;border:1px solid #ddd;background:#fff;cursor:pointer;font-size:13px;"
      }
    });
    refreshBtn.addEventListener("click", () => this.refreshNow());
    const contentArea = this.containerEl.createEl("div", {
      attr: {
        style: "flex:1;overflow-y:auto;padding:20px;max-width:700px;margin:0 auto;font-size:16px;line-height:1.75;"
      }
    });
    contentArea.innerHTML = '<p style="color:#999;text-align:center;margin-top:100px;">\u6253\u5F00\u4E00\u7BC7 Markdown \u7B14\u8BB0\uFF0C<br>\u70B9\u51FB\u5DE6\u4E0B\u89D2\u300CWeChat Preview\u300D\u6309\u94AE\u9884\u89C8\u6392\u7248\u6548\u679C\u3002</p>';
    this._renderEl = contentArea;
    setTimeout(() => this.refreshNow(), 100);
  }
  setContent(html) {
    const el = this._renderEl;
    if (el) {
      el.innerHTML = html;
      el.querySelectorAll(".wechat-copy-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const wrapper = btn.parentElement;
          const pre = wrapper?.querySelector("pre");
          const code = pre?.textContent || "";
          navigator.clipboard.writeText(code).then(() => {
            const origText = btn.textContent || "\u{1F4CB} \u590D\u5236\u4EE3\u7801";
            btn.textContent = "\u2705 \u5DF2\u590D\u5236";
            setTimeout(() => {
              btn.textContent = origText;
            }, 2e3);
          }).catch(() => {
            btn.textContent = "\u274C \u590D\u5236\u5931\u8D25";
            setTimeout(() => {
              btn.textContent = "\u{1F4CB} \u590D\u5236\u4EE3\u7801";
            }, 2e3);
          });
        });
      });
    }
  }
  scheduleRefresh() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = window.setTimeout(() => {
      this.refreshNow();
    }, 300);
  }
  async refreshNow() {
    const editor = this.plugin.getEditor();
    const el = this._renderEl;
    if (!el || !editor) {
      return;
    }
    const markdown = editor.getValue();
    if (!markdown) {
      el.innerHTML = '<p style="color:#999;text-align:center;">\u5F53\u524D\u6587\u6863\u4E3A\u7A7A</p>';
      return;
    }
    try {
      const html = await this.plugin.renderToWeChat(markdown);
      el.innerHTML = html;
      el.querySelectorAll(".wechat-copy-btn").forEach((btn) => {
        const wrapper = btn.closest("div");
        const pre = wrapper?.querySelector("pre");
        if (!pre) return;
        btn.addEventListener("click", async () => {
          const code = pre.textContent || "";
          try {
            await navigator.clipboard.writeText(code);
            btn.textContent = "\u2705 \u5DF2\u590D\u5236";
            setTimeout(() => {
              btn.textContent = "\u{1F4CB} \u590D\u5236\u4EE3\u7801";
            }, 2e3);
          } catch {
            const range = document.createRange();
            range.selectNodeContents(pre);
            const sel = window.getSelection();
            if (sel) {
              sel.removeAllRanges();
              sel.addRange(range);
            }
            btn.textContent = "\u2705 \u5DF2\u590D\u5236";
            setTimeout(() => {
              btn.textContent = "\u{1F4CB} \u590D\u5236\u4EE3\u7801";
            }, 2e3);
          }
        });
      });
    } catch (e) {
      el.innerHTML = `<p style="color:#e74c3c;">\u6E32\u67D3\u51FA\u9519: ${e}</p>`;
    }
  }
  onClose() {
    if (this.containerEl) {
      this.containerEl.empty();
    }
  }
};
var WeChatFormatPlugin = class extends Plugin {
  settings;
  previewView = null;
  editorChangeHandler;
  wechatApi;
  async onload() {
    await this.loadSettings();
    this.wechatApi = new WeChatApi(
      this.settings.appId,
      this.settings.appSecret,
      this.settings.thumbMediaId
    );
    this.addCommand({
      id: "wechat-format-copy",
      name: "\u{1F4CB} \u590D\u5236\u6392\u7248\u5230\u526A\u8D34\u677F\uFF08WeChat Format\uFF09",
      editorCallback: () => this.formatToClipboard()
    });
    this.addCommand({
      id: "wechat-format-preview",
      name: "\u{1F5BC}\uFE0F \u6253\u5F00\u516C\u4F17\u53F7\u6392\u7248\u9884\u89C8\u9762\u677F",
      callback: () => this.openPreview()
    });
    this.addCommand({
      id: "wechat-format-export",
      name: "\u{1F4BE} \u5BFC\u51FA\u4E3A\u516C\u4F17\u53F7 HTML \u6587\u4EF6",
      editorCallback: () => this.exportHTML()
    });
    this.addCommand({
      id: "wechat-format-send-draft",
      name: "\u{1F4E4} \u53D1\u9001\u5230\u516C\u4F17\u53F7\u8349\u7A3F\u7BB1",
      editorCallback: () => this.sendToDraft()
    });
    this.addSettingTab(new WeChatFormatSettingTab(this.app, this));
    this.registerView(WECHAT_PREVIEW_VIEW, (leaf) => {
      this.previewView = new WeChatPreviewView(leaf, this);
      return this.previewView;
    });
    this.editorChangeHandler = () => {
      if (this.previewView) {
        this.previewView.scheduleRefresh();
      }
    };
    this.registerEvent(
      this.app.workspace.on("editor-change", this.editorChangeHandler)
    );
    this.registerEvent(
      this.app.workspace.on("file-open", () => {
        if (this.previewView) {
          this.previewView.scheduleRefresh();
        }
      })
    );
    this.app.workspace.onLayoutReady(() => {
      const leaves = this.app.workspace.getLeavesOfType(WECHAT_PREVIEW_VIEW);
      if (leaves.length > 0) {
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
      console.warn("[WeChatFormat] onunload detach warning:", e);
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
  copyHTMLToClipboard(html) {
    try {
      if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
        const plain = new DOMParser().parseFromString(html, "text/html").body.innerText;
        const item = new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" })
        });
        return navigator.clipboard.write([item]).then(
          () => true,
          (err) => {
            console.error("[WeChatFormat] ClipboardItem.write failed:", err);
            return null;
          }
        );
      }
    } catch (e) {
      console.error("[WeChatFormat] ClipboardItem rejected:", e);
    }
    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      tempDiv.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;";
      document.body.appendChild(tempDiv);
      const range = document.createRange();
      range.selectNodeContents(tempDiv);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
      const ok = document.execCommand("copy");
      if (sel) sel.removeAllRanges();
      tempDiv.remove();
      return ok ? true : false;
    } catch (e) {
      console.error("[WeChatFormat] execCommand copy failed:", e);
      return false;
    }
  }
  async formatToClipboard() {
    const editor = this.getEditor();
    if (!editor) {
      new Notice("\u26A0\uFE0F \u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u7B14\u8BB0\u6587\u4EF6");
      return;
    }
    const markdown = editor.getValue();
    const wechatHtml = await this.renderToWeChat(markdown);
    try {
      const res = await this.copyHTMLToClipboard(wechatHtml);
      if (res === true) {
        new Notice("\u2705 \u6392\u7248\u5185\u5BB9\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F\uFF01\u76F4\u63A5\u7C98\u8D34\u5230\u516C\u4F17\u53F7\u7F16\u8F91\u5668\u5373\u53EF");
      } else if (res === false) {
        new Notice("\u274C \u590D\u5236\u5931\u8D25\u3002\u8BD5\u8BD5\u300C\u5BFC\u51FA\u4E3A HTML\u300D\u547D\u4EE4\u540E\u624B\u52A8\u590D\u5236");
      } else {
        new Notice("\u26A0\uFE0F \u590D\u5236\u4EC5\u6587\u672C\u683C\u5F0F\uFF08\u65E0\u6837\u5F0F\uFF09\u3002\u8BD5\u8BD5\u300C\u5BFC\u51FA HTML\u300D\u547D\u4EE4");
      }
    } catch (e) {
      new Notice(`\u274C \u590D\u5236\u5931\u8D25: ${String(e)}`);
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
      new Notice("\u26A0\uFE0F \u65E0\u6CD5\u521B\u5EFA\u9884\u89C8\u9762\u677F");
      return;
    }
    await leaf.setViewState({ type: WECHAT_PREVIEW_VIEW, active: true });
    this.app.workspace.revealLeaf(leaf);
  }
  async refreshPreview() {
    if (!this.previewView) return;
    const editor = this.getEditor();
    if (!editor) {
      const inner = this.previewView._renderEl;
      if (!inner) {
        return;
      }
      inner.innerHTML = '<p style="color:#999;text-align:center;padding:40px;">\u8BF7\u6253\u5F00\u4E00\u4E2A\u7B14\u8BB0\u6587\u4EF6\u4EE5\u9884\u89C8\u6392\u7248\u6548\u679C</p>';
      return;
    }
    const markdown = editor.getValue();
    if (!markdown.trim()) {
      const inner = this.previewView._renderEl;
      if (!inner) return;
      inner.innerHTML = '<p style="color:#999;text-align:center;padding:40px;">\u5F53\u524D\u7B14\u8BB0\u4E3A\u7A7A</p>';
      return;
    }
    const html = await this.renderToWeChat(markdown);
    this.previewView.setContent(html);
  }
  async exportHTML() {
    const editor = this.getEditor();
    if (!editor) {
      new Notice("\u26A0\uFE0F \u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u7B14\u8BB0\u6587\u4EF6");
      return;
    }
    const markdown = editor.getValue();
    if (!markdown.trim()) {
      new Notice("\u26A0\uFE0F \u5F53\u524D\u7B14\u8BB0\u4E3A\u7A7A");
      return;
    }
    const wechatHtml = await this.renderToWeChat(markdown);
    const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>\u5FAE\u4FE1\u516C\u4F17\u53F7\u6587\u7AE0</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;">
${wechatHtml}
</body>
</html>`;
    try {
      const activeFile = this.app.workspace.getActiveFile();
      let basePath = activeFile ? activeFile.path.replace(/\.md$/, "") : "WeChat-Article-" + Date.now();
      const exportPath = basePath + "-wechat.html";
      const exportFile = await this.app.vault.create(exportPath, fullHtml);
      new Notice(`\u2705 \u5DF2\u5BFC\u51FA: ${exportFile.path}`);
    } catch (e) {
      new Notice("\u274C \u5BFC\u51FA\u5931\u8D25: " + e.message);
    }
  }
  // ===== Send to WeChat Draft =====
  async sendToDraft() {
    if (!this.wechatApi.isConfigured()) {
      new Notice("\u26A0\uFE0F \u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u586B\u5199 AppID \u548C AppSecret");
      return;
    }
    const editor = this.getEditor();
    if (!editor) {
      new Notice("\u26A0\uFE0F \u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u7B14\u8BB0\u6587\u4EF6");
      return;
    }
    const markdown = editor.getValue();
    if (!markdown.trim()) {
      new Notice("\u26A0\uFE0F \u5F53\u524D\u7B14\u8BB0\u4E3A\u7A7A");
      return;
    }
    this.wechatApi.updateCredentials(
      this.settings.appId,
      this.settings.appSecret,
      this.settings.thumbMediaId
    );
    if (!this.settings.thumbMediaId) {
      new Notice("\u{1F4E4} \u6B63\u5728\u81EA\u52A8\u4E0A\u4F20\u9ED8\u8BA4\u5C01\u9762...");
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
        new Notice(`\u274C \u81EA\u52A8\u4E0A\u4F20\u5C01\u9762\u5931\u8D25: ${e.message}\uFF0C\u8BF7\u624B\u52A8\u5728\u8BBE\u7F6E\u4E2D\u64CD\u4F5C`);
        return;
      }
    }
    const title = this.extractTitle(markdown);
    const author = this.settings.author || "\u516C\u4F17\u53F7";
    const digest = this.extractDigest(markdown);
    if (!title) {
      new Notice("\u26A0\uFE0F \u65E0\u6CD5\u63D0\u53D6\u6807\u9898\uFF0C\u8BF7\u786E\u4FDD\u6587\u7AE0\u4EE5 # \u6807\u9898 \u5F00\u5934");
      return;
    }
    new Notice("\u{1F4E4} \u6B63\u5728\u751F\u6210\u6392\u7248\u5E76\u53D1\u9001\u5230\u516C\u4F17\u53F7...");
    try {
      let wechatHtml = await this.renderToWeChat(markdown);
      wechatHtml = await this.uploadArticleImages(wechatHtml);
      const result = await this.wechatApi.createDraft(title, wechatHtml, author, digest);
      new Notice(`\u2705 \u5DF2\u53D1\u9001\u5230\u8349\u7A3F\u7BB1\uFF01media_id: ${result.media_id || "\u672A\u77E5"}`);
    } catch (e) {
      const errorDetail = e instanceof Error ? `${e.message}
${(e.stack || "").split("\n").slice(0, 3).join("\n")}` : String(e);
      console.error("[WeChat Format] sendToDraft error:", errorDetail);
      new Notice(`\u274C \u53D1\u9001\u5931\u8D25: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  /**
   * Extract title from markdown: first H1 heading, or filename if no heading found.
   */
  extractTitle(markdown) {
    let text = markdown.replace(/^---[\s\S]*?---\n*/, "");
    text = text.replace(/```[\s\S]*?```/g, "");
    text = text.replace(/~~~[\s\S]*?~~~/g, "");
    const titleMatch = text.match(/^#\s+(.+)$/m);
    if (titleMatch) return titleMatch[1].trim();
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      return activeFile.basename;
    }
    return "";
  }
  /**
   * Extract digest/summary: first paragraph of content (up to 120 chars)
   */
  extractDigest(markdown) {
    const noTitle = markdown.replace(/^#\s+.*$/m, "").trim();
    const paraMatch = noTitle.match(/^(.{10,200})/m);
    if (paraMatch) {
      let digest = paraMatch[1].replace(/[#*_`\[\]]/g, "").trim();
      if (digest.length > 120) digest = digest.substring(0, 117) + "...";
      return digest;
    }
    return "";
  }
  /**
   * Parse WeChat HTML, upload local images to WeChat material library,
   * and replace their src with permanent WeChat CDN URLs.
   */
  async uploadArticleImages(wechatHtml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${wechatHtml}</div>`, "text/html");
    const root = doc.body.firstElementChild;
    const imgs = root.querySelectorAll("img");
    if (imgs.length === 0) return wechatHtml;
    new Notice(`\u{1F4F7} \u6B63\u5728\u4E0A\u4F20 ${imgs.length} \u5F20\u56FE\u7247\u5230\u7D20\u6750\u5E93...`);
    let successCount = 0;
    let failCount = 0;
    let modifiedCount = 0;
    for (const img of Array.from(imgs)) {
      const src = img.getAttribute("src") || "";
      if (!src) continue;
      if (src.startsWith("http://") || src.startsWith("https://")) continue;
      if (src.startsWith("data:")) continue;
      try {
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(`Fetch failed: HTTP ${response.status}`);
        }
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const urlPath = src.split("?")[0];
        const urlParts = urlPath.split("/");
        const rawFilename = urlParts[urlParts.length - 1] || "image";
        const filename = decodeURIComponent(rawFilename);
        const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
        const mimeTypes = {
          "jpg": "image/jpeg",
          "jpeg": "image/jpeg",
          "png": "image/png",
          "gif": "image/gif",
          "webp": "image/webp",
          "bmp": "image/bmp",
          "svg": "image/svg+xml"
        };
        const mimeType = mimeTypes[ext] || blob.type || "image/jpeg";
        const result = await this.wechatApi.uploadImage(arrayBuffer, filename, mimeType);
        img.setAttribute("src", result.url);
        successCount++;
        modifiedCount++;
      } catch (e) {
        failCount++;
        const msg = e instanceof Error ? e.message : String(e);
        new Notice(`\u26A0\uFE0F \u56FE\u7247\u4E0A\u4F20\u5931\u8D25: ${src.split("/").pop()} \u2014 ${msg}`);
        console.error(`[WeChat Format] Failed to upload image: ${src}`, e);
        const placeholder = doc.createElement("span");
        placeholder.textContent = `[\u56FE\u7247: ${src.split("/").pop() || "unknown"}]`;
        placeholder.setAttribute("style", "color:#999;font-size:0.9em;");
        img.parentNode?.replaceChild(placeholder, img);
        modifiedCount++;
      }
    }
    if (modifiedCount > 0) {
      const total = successCount + failCount;
      if (failCount === 0) {
        new Notice(`\u2705 ${successCount} \u5F20\u56FE\u7247\u5DF2\u4E0A\u4F20\u5230\u7D20\u6750\u5E93`);
      } else {
        new Notice(`\u2705 ${successCount}/${total} \u5F20\u4E0A\u4F20\u6210\u529F\uFF0C${failCount} \u5F20\u5931\u8D25\uFF08\u8BE6\u89C1\u63A7\u5236\u53F0\uFF09`);
      }
      return root.innerHTML;
    } else {
      if (failCount > 0) {
        new Notice(`\u26A0\uFE0F \u6240\u6709 ${failCount} \u5F20\u56FE\u7247\u4E0A\u4F20\u5931\u8D25\uFF0C\u8BF7\u67E5\u770B\u63A7\u5236\u53F0\u65E5\u5FD7`);
      }
      return wechatHtml;
    }
  }
  // ===== Core Rendering =====
  async renderToWeChat(markdown) {
    markdown = markdown.replace(/^---[\s\S]*?---\n*/, "");
    const html = await this.markdownToHTML(markdown);
    console.log("[WeChatFormat] Raw HTML from markdownToHTML:", {
      length: html.length,
      olCount: (html.match(/<ol[ >]/gi) || []).length,
      liCount: (html.match(/<li[ >]/gi) || []).length,
      preCount: (html.match(/<pre[ >]/gi) || []).length,
      olStarts: [...html.matchAll(/<ol\s[^>]*start="(\d+)"/gi)].map((m) => m[1])
    });
    let wechatHtml = convertToWeChatHTML(html, this.settings);
    if (this.settings.enableQuote && this.settings.quoteText.trim()) {
      const c = THEMES[this.settings.theme]?.colors;
      const quoteHtml = `<section style="margin:0.5em 0 1em 0;padding:14px 18px;background:${c?.quoteBg || "#f9f9f9"};border-radius:4px;border-left:4px solid ${c?.quoteBorder || "#c0392b"};font-family:-apple-system,'Helvetica Neue','PingFang SC','Microsoft YaHei',sans-serif;">
<p style="margin:0 0 ${this.settings.quoteAuthor ? "8px" : "0"} 0;font-size:${this.settings.quoteFontSize};line-height:${this.settings.lineHeight};color:${c?.text || "#333"};font-weight:700;font-style:italic;">${this.escapeHTML(this.settings.quoteText)}</p>
${this.settings.quoteAuthor ? `<p style="margin:0;font-size:0.9em;color:${c?.primary || "#c0392b"};text-align:right;">\u2014\u2014 ${this.escapeHTML(this.settings.quoteAuthor)}</p>` : ""}
</section>`;
      wechatHtml = wechatHtml.replace("<section", quoteHtml + "\n<section");
    }
    return wechatHtml;
  }
  escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  async markdownToHTML(markdown) {
    const tempDiv = document.createElement("div");
    await MarkdownRenderer.render(this.app, markdown, tempDiv, "/", this);
    return tempDiv.innerHTML;
  }
  getEditor() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) return view.editor;
    try {
      const activeFile = this.app.workspace.getActiveFile();
      const leaves = this.app.workspace.getLeavesOfType("markdown");
      if (activeFile) {
        for (const leaf of leaves) {
          const v = leaf.view;
          if (v instanceof MarkdownView && v.file === activeFile && v.editor) {
            return v.editor;
          }
        }
      }
      for (const leaf of leaves) {
        const v = leaf.view;
        if (v instanceof MarkdownView && v.editor) return v.editor;
      }
    } catch (e) {
    }
    return null;
  }
};
if (typeof module !== "undefined" && module.exports) {
  module.exports = WeChatFormatPlugin;
}
