// ==UserScript==
// @name         学习通作业图文导出（AI友好版）
// @namespace    local.chaoxing.export
// @version      1.3.1
// @homepageURL  https://github.com/exekillte/Mini-Program/tree/main/userscripts/chaoxing-question-export
// @downloadURL  https://raw.githubusercontent.com/exekillte/Mini-Program/main/userscripts/chaoxing-question-export/chaoxing-question-export.user.js
// @updateURL    https://raw.githubusercontent.com/exekillte/Mini-Program/main/userscripts/chaoxing-question-export/chaoxing-question-export.user.js
// @description  学习通作业提取：题干/选项/图片导出，支持网页分页/A4分页截图并自动排除答题编辑器
// @match        *://*.chaoxing.com/mooc-ans/mooc2/work/*
// @match        *://*.chaoxing.com/mooc2/work/*
// @match        *://*.chaoxing.com/exam-ans/exam/test/*
// @match        *://*.chaoxing.com/exam/exam/test/*
// @match        *://chaoxing.com/mooc-ans/mooc2/work/*
// @match        *://chaoxing.com/mooc2/work/*
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
// @connect      *
// ==/UserScript==

(() => {
  'use strict';
  if (!/\/(?:mooc-ans\/)?mooc2\/work\/(?:dowork|view)\b|\/exam(?:-ans)?\/exam\/test\//i.test(location.pathname)) return;
  if (window.top !== window.self) {
    // 如果作业嵌在同源框架中，仍可在作业框架内显示按钮。
  }
  const PANEL_ID = 'cx-export-local-panel-2026';
  if (document.getElementById(PANEL_ID)) return;
  const encoder = new TextEncoder();
  const RX_TYPES = /(单选题|多选题|不定项选择题|判断题|填空题|简答题|计算题|论述题|其他题)/;
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const tidy = s => String(s || '').replace(/\u00a0/g, ' ').replace(/[\t ]+/g, ' ').replace(/[ \t]*\n[ \t]*/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const filename = s => String(s || '学习通作业').replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').replace(/\s+/g, '_').slice(0, 65);
  const tag = el => el && el.tagName ? el.tagName.toLowerCase() : '';
  const visible = el => !!el && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden';

  function locateQuestions() {
    const groups = ['div[id^="question"].questionLi', '.questionLi', '.singleQuesId', '.TiMu.newTiMu', '.mark_item', 'div[id^="question"]', '.TiMu'];
    for (const selector of groups) {
      const found = [...document.querySelectorAll(selector)].filter(el => visible(el) && (el.innerText || '').trim().length > 8);
      if (found.length) {
        // 移除同一组中嵌套的题目容器，防止重复。
        return found.filter(el => !found.some(other => other !== el && other.contains(el)));
      }
    }
    return [];
  }

  function pageTitle() {
    const el = document.querySelector('.work_name, .workName, .workTitle, .ceyan_name h3, .task_title');
    return tidy(el?.innerText || document.title || '学习通作业');
  }

  function expectedCount() {
    const match = (document.body.innerText || '').slice(0, 1500).match(/题量\s*[：:]?\s*(\d{1,3})/);
    return match ? Number(match[1]) : null;
  }

  function rich(node, context) {
    if (!node) return '';
    if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || '';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const name = tag(node);
    if (['script','style','noscript','button','select','option','label'].includes(name)) return '';
    if (node.matches('[hidden], [aria-hidden="true"], .colorShallow')) {
      // 题型标签单独提取，避免重复出现在题干里。
      return '';
    }
    if (!visible(node)) return '';

    if (name === 'img') {
      let src = node.currentSrc || node.getAttribute('data-original') || node.getAttribute('data-src') || node.getAttribute('src') || '';
      if (!src || /^about:blank/.test(src)) return '[图片地址未加载]';
      const alt = node.getAttribute('alt') || '';
      if (/MathJax|mathjax|latex|formula/.test(node.className || '') && alt) return `$${alt}$`;
      return context.register(src, '图片');
    }
    if (name === 'svg') return context.register(node, '矢量图');
    if (name === 'canvas') return context.register(node, '画布图');
    if (name === 'math') {
      const m = node.querySelector('annotation[encoding="application/x-tex"]');
      return m ? `$${m.textContent}$` : node.textContent;
    }
    if (name === 'input') {
      if (node.type === 'hidden' || node.type === 'radio' || node.type === 'checkbox') return '';
      return node.value ? `[填空：${node.value}]` : '______';
    }
    if (name === 'textarea') return node.value ? `[填空：${node.value}]` : '______';
    if (name === 'br') return '\n';

    const result = [...node.childNodes].map(child => rich(child, context)).join('');
    if (name === 'sup') return `<sup>${result}</sup>`;
    if (name === 'sub') return `<sub>${result}</sub>`;
    if (name === 'code') return '`' + result + '`';
    if (name === 'pre') return `\n\n\`\`\`\n${result}\n\`\`\`\n\n`;
    if (['p','div','section','article','h1','h2','h3','h4','li','tr','table'].includes(name)) return `${result}\n`;
    if (name === 'td' || name === 'th') return `${result}  |  `;
    return result;
  }

  function questionNodes(root) {
    let titles = root.querySelector('h3.mark_name, h3, .Zy_TItle .fontLabel, .Cy_TItle, .fontLabel, .question-title, .question_title');
    if (!titles) titles = root;
    const preferred = [...root.querySelectorAll('.stem_answer > .answerBg, .stem_answer .answerBg, .Zy_ulTop > li, ul.mark_letter > li, .option-list > li')];
    // 过滤作为整体包装的、内部还包含多个选项标志的节点。
    let options = preferred.filter(el => !preferred.some(other => other !== el && el.contains(other)));
    if (!options.length) options = [...root.querySelectorAll('.answerBg, li[qid]')];
    return { titles, options };
  }

  function visibleText(el) {
    if (!el) return '';
    return tidy(el.innerText || el.textContent || '');
  }

  function stripQuestionHeader(text) {
    let s = tidy(text);
    s = s.replace(/^\s*(?:第\s*)?\d{1,3}\s*(?:题)?\s*[.、．:：]?\s*/, '');
    s = s.replace(/^\s*[（(]\s*(?:单选题|多选题|不定项选择题|判断题|填空题|简答题|计算题|论述题|其他题)\s*[）)]\s*/, '');
    s = s.replace(/^\s*(?:单选题|多选题|不定项选择题|判断题|填空题|简答题|计算题|论述题|其他题)\s*/, '');
    return tidy(s);
  }

  // 从 innerText 中兜底识别 A/B/C/D 形式的选项；格式不明确时宁可保留整题文本，也不丢内容。
  function parseTextOptions(text) {
    const lines = tidy(text).split('\n').map(tidy).filter(Boolean);
    const isOptionStart = line => /^[A-F](?:\s*[.、．:：）)]\s*|\s{2,})\S/.test(line) || /^[A-F]$/.test(line);
    const start = lines.findIndex((line, i) => isOptionStart(line) && (i === 0 || !/^[A-F]$/.test(line) || !!lines[i + 1]));
    if (start < 0) return null;
    const options = [];
    let current = null;
    for (let i = start; i < lines.length; i++) {
      const line = lines[i];
      let m = line.match(/^([A-F])\s*[.、．:：）)]\s*(.*)$/);
      if (m) {
        if (current) options.push(current);
        current = `${m[1]}. ${m[2]}`.trim();
        continue;
      }
      if (/^[A-F]$/.test(line)) {
        if (current) options.push(current);
        const next = lines[i + 1] || '';
        current = `${line}. ${next}`.trim();
        if (next) i++;
        continue;
      }
      if (current) current += ` ${line}`;
    }
    if (current) options.push(current);
    if (options.length < 2) return null;
    return { stem: lines.slice(0, start).join('\n'), options };
  }

  function collectQuestionImages(root, context) {
    const refs = [];
    for (const node of root.querySelectorAll('img,svg,canvas')) {
      if (!visible(node)) continue;
      let source = null;
      let role = '图片';
      if (tag(node) === 'img') {
        source = node.currentSrc || node.getAttribute('data-original') || node.getAttribute('data-src') || node.getAttribute('src') || '';
        if (!source || /^about:blank/.test(source)) continue;
      } else if (tag(node) === 'svg') {
        source = node; role = '矢量图';
      } else if (tag(node) === 'canvas') {
        source = node; role = '画布图';
      }
      if (source) refs.push(context.register(source, role));
    }
    return [...new Set(refs)].join('\n');
  }

  function extractOne(root, index) {
    const n = questionNodes(root);
    const rawText = visibleText(root);
    const prefix = visibleText(n.titles) || rawText;
    const typeText = visibleText(root.querySelector('.colorShallow, .newZy_TItle, .question-type, .questionType')) || rawText || prefix;
    const type = (typeText.match(RX_TYPES) || [])[1] || (root.querySelector('textarea,input[type="text"]') ? '填空题' : '未知题型');
    const parsedNum = prefix.match(/^\s*(?:第\s*)?(\d{1,3})\s*(?:题)?\s*[.、．]?/);
    const parsedId = (root.id || '').match(/question(\d+)/i);
    const number = parsedNum ? Number(parsedNum[1]) : parsedId ? Number(parsedId[1]) : index + 1;

    const context = {
      images: [],
      seen: new Map(),
      register(source, role) {
        const sourceKey = typeof source === 'string' ? source : source;
        if (this.seen.has(sourceKey)) return this.seen.get(sourceKey);
        const k = this.images.length + 1;
        const path = `images/Q${String(number).padStart(2, '0')}_${String(k).padStart(2, '0')}`;
        const key = `${path}`;
        this.images.push({ source, key, role });
        const markdown = `![第${number}题${role}${k}](${key}__EXT__)`;
        this.seen.set(sourceKey, markdown);
        return markdown;
      }
    };

    // 优先找题干专属节点；旧版 h3.mark_name 有时只有“题号+题型”，不能直接当题干。
    const stemSelectors = '.stem,.question_stem,.questionText,.question_content,.qtContent,.stem_content,.Zy_TItle .fontLabel';
    const candidates = [...root.querySelectorAll(stemSelectors), n.titles]
      .filter((el, i, arr) => el && arr.indexOf(el) === i);
    let body = '';
    let bodySource = '整题文本兜底';
    let textOptions = null;
    for (const el of candidates) {
      const candidate = visibleText(el);
      if (!candidate) continue;
      const split = parseTextOptions(candidate);
      const cleaned = stripQuestionHeader(split ? split.stem : candidate);
      if (cleaned.length >= 4) {
        body = cleaned;
        bodySource = el === root ? '整题文本兜底' : (el === n.titles ? '标题/题干节点' : '题干节点');
        if (split) textOptions = split.options;
        break;
      }
    }

    // 所有旧选择器都没有拿到有效题干时，直接保留该题容器的完整可见文本。
    if (!body) {
      const split = parseTextOptions(rawText);
      if (split && stripQuestionHeader(split.stem).length >= 2) {
        body = stripQuestionHeader(split.stem);
        textOptions = split.options;
      } else {
        body = stripQuestionHeader(rawText);
      }
    }

    const options = [];
    if (/单选|多选|不定项|判断/.test(type) || n.options.length) {
      n.options.forEach((el, i) => {
        const choice = el.querySelector('.answer_p, .after, .option-content, .option_text');
        let t = visibleText(choice || el);
        if (!t) t = tidy(rich(choice || el, context));
        const letter = tidy(el.querySelector('.num_option,.num_option_dx')?.textContent || '') || LETTERS[i] || `选项${i+1}`;
        t = t.replace(/^[A-Z]\s*[.、．:：]\s*/, '').trim();
        if (t || el.querySelector('img,svg,canvas')) options.push(`${letter}. ${t || '[图片选项]'}`);
      });
    }
    if (!options.length && textOptions) options.push(...textOptions);

    const imageMarkdown = collectQuestionImages(root, context);
    if (!body && context.images.length) body = '[题目主要内容为图片，请查看图文 ZIP 中对应图片]';
    if (!body) body = '[题干识别失败：页面容器中没有可读取的文本或图片]';
    if (imageMarkdown) body += `\n\n${imageMarkdown}`;
    if (/填空/.test(type) && !/_{3,}|填空/.test(body)) body += '\n（请填写题目中的空格）';
    return { number, type, body, options, images:context.images, bodySource, root };
  }

  function parse() {
    const roots = locateQuestions();
    const questions = roots.map((root, i) => extractOne(root, i));
    const unique = [...new Map(questions.map(q => [String(q.number), q])).values()].sort((a,b) => a.number-b.number);
    return { title:pageTitle(), count:expectedCount(), questions:unique, timestamp:new Date().toLocaleString('zh-CN') };
  }

  function makeMd(info) {
    const chunks = [
      `# ${info.title}`,
      '',
      `- 采集时间：${info.timestamp}`,
      `- 识别题量：${info.questions.length}${info.count ? ` / 页面标注 ${info.count}` : ''}`,
      '- 说明：题目按原始顺序排列，图片与题号关联；未自动填写或提交。',
      ''
    ];
    for (const q of info.questions) {
      chunks.push(`## 第${q.number}题（${q.type}）`, '', q.body, '', ...q.options, '', '');
    }
    return chunks.join('\n');
  }

  function makeTxt(info) {
    return makeMd(info).replace(/^#{1,3}\s/gm,'').replace(/!\[([^\]]+)\]\(([^)]+)\)/g,'[图片：$1；请使用图文ZIP查看原图]');
  }

  function save(name, bytes, mime) {
    const blob = bytes instanceof Blob ? bytes : new Blob([bytes], { type:mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a);
    a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 20000);
  }

  async function imageBytes(entry) {
    const x = entry.source;
    if (x instanceof SVGElement) {
      let xml = new XMLSerializer().serializeToString(x);
      if (!xml.includes('xmlns=')) xml = xml.replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"');
      return { bytes:encoder.encode(xml), ext:'svg' };
    }
    if (x instanceof HTMLCanvasElement) {
      return { bytes:new Uint8Array(await (await fetch(x.toDataURL('image/png'))).arrayBuffer()), ext:'png' };
    }
    const src = new URL(String(x), document.baseURI).href;
    async function normalFetch() {
      const response = await fetch(src, {credentials:'include'});
      if (!response.ok) throw Error('HTTP ' + response.status);
      return {bytes:new Uint8Array(await response.arrayBuffer()), type:response.headers.get('content-type')||''};
    }
    async function gmFetch() {
      if (typeof GM_xmlhttpRequest !== 'function') throw Error('跨域下载不可用');
      return await new Promise((resolve,reject) => GM_xmlhttpRequest({
        method:'GET', url:src, responseType:'arraybuffer', timeout:18000,
        onload(r) {
          if (r.status < 200 || r.status >= 300) return reject(Error('HTTP '+r.status));
          resolve({bytes:new Uint8Array(r.response), type:(r.responseHeaders.match(/content-type:\s*([^\r\n;]+)/i)||[])[1]||''});
        }, onerror:() => reject(Error('请求失败')),
        ontimeout:() => reject(Error('请求超时'))
      }));
    }
    let result;
    try { result = await normalFetch(); }
    catch { result = await gmFetch(); }
    const declared = result.type.toLowerCase();
    const ext = /png/.test(declared) ? 'png' : /webp/.test(declared) ? 'webp' : /gif/.test(declared) ? 'gif' : /svg/.test(declared) ? 'svg' : /bmp/.test(declared) ? 'bmp' : /jpeg|jpg/.test(declared) ? 'jpg' : /\.png(?:[?#]|$)/i.test(src) ? 'png' : /\.webp(?:[?#]|$)/i.test(src) ? 'webp' : /\.gif(?:[?#]|$)/i.test(src) ? 'gif' : /\.svg(?:[?#]|$)/i.test(src) ? 'svg' : 'jpg';
    return {...result, ext};
  }

  // 原生 ZIP (STORE/不压缩)：免 CDN、免第三方依赖，含 UTF-8 文件名标记。
  const crcTable = (() => {
    const t = new Uint32Array(256);
    for(let n=0;n<256;n++) { let c=n; for(let k=0;k<8;k++) c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1); t[n]=c>>>0; }
    return t;
  })();
  function crc32(data) { let c=0xFFFFFFFF; for(const b of data) c=crcTable[(c^b)&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }
  function buildZip(entries) {
    const locals=[], central=[];
    let offset=0, centralSize=0;
    const date=new Date();
    const dosTime=(date.getHours()<<11)|(date.getMinutes()<<5)|Math.floor(date.getSeconds()/2);
    const dosDate=((Math.max(date.getFullYear(),1980)-1980)<<9)|((date.getMonth()+1)<<5)|date.getDate();
    for (const {name, data} of entries) {
      const nb=encoder.encode(name), b=data instanceof Uint8Array ? data : encoder.encode(String(data));
      const crc=crc32(b), size=b.length;
      const local=new Uint8Array(30+nb.length);
      const lv=new DataView(local.buffer);
      lv.setUint32(0,0x04034b50,true); lv.setUint16(4,20,true); lv.setUint16(6,0x0800,true);
      lv.setUint16(8,0,true); lv.setUint16(10,dosTime,true); lv.setUint16(12,dosDate,true);
      lv.setUint32(14,crc,true); lv.setUint32(18,size,true); lv.setUint32(22,size,true);
      lv.setUint16(26,nb.length,true); lv.setUint16(28,0,true); local.set(nb,30);
      locals.push(local,b);
      const cd=new Uint8Array(46+nb.length);
      const cv=new DataView(cd.buffer);
      cv.setUint32(0,0x02014b50,true); cv.setUint16(4,20,true); cv.setUint16(6,20,true);
      cv.setUint16(8,0x0800,true); cv.setUint16(10,0,true); cv.setUint16(12,dosTime,true);
      cv.setUint16(14,dosDate,true); cv.setUint32(16,crc,true);
      cv.setUint32(20,size,true); cv.setUint32(24,size,true); cv.setUint16(28,nb.length,true);
      cv.setUint32(42,offset,true); cd.set(nb,46);
      central.push(cd); centralSize+=cd.length;
      offset+=local.length+b.length;
    }
    const end=new Uint8Array(22), ev=new DataView(end.buffer);
    ev.setUint32(0,0x06054b50,true); ev.setUint16(8,entries.length,true);
    ev.setUint16(10,entries.length,true); ev.setUint32(12,centralSize,true);
    ev.setUint32(16,offset,true);
    return new Blob([...locals,...central,end],{type:'application/zip'});
  }

  async function toZip(info) {
    const allImages=info.questions.flatMap(q=>q.images);
    const entries=[], replacements=new Map(), failed=[];
    const seen=new Map();
    for (let i=0;i<allImages.length;i++) {
      const item=allImages[i];
      setStatus(`获取图片 ${i+1}/${allImages.length}…`);
      const sameKey=typeof item.source==='string' ? item.source : null;
      if (sameKey && seen.has(sameKey)) {
        replacements.set(`${item.key}__EXT__`,seen.get(sameKey));
        continue;
      }
      try {
        const res=await imageBytes(item);
        if (!res.bytes.length) throw Error('图片为空');
        const path=item.key+'.'+res.ext;
        entries.push({name:path,data:res.bytes});
        replacements.set(`${item.key}__EXT__`,path);
        if(sameKey) seen.set(sameKey,path);
      } catch(e) {
        failed.push(`${item.key}: ${e.message}`);
        replacements.set(`${item.key}__EXT__`,'图片读取失败');
      }
    }

    // 对低置信度题目补充分页截图，不再为每道题单独生成一张长图。
    const flagged = info.questions.filter(q => questionWarnings(q).length);
    let screenshotCount = 0;
    let screenshotFailed = [];
    if (flagged.length) {
      setStatus(`图片处理完成；正在为 ${flagged.length} 道需复核题目生成分页截图…`);
      try {
        const shots = await capturePaginatedScreenshots(info, flagged, 'screen');
        entries.push(...shots.entries);
        screenshotCount = shots.entries.filter(x => /\.png$/i.test(x.name)).length;
        entries.push({name:'screenshots/分页说明.txt',data:encoder.encode(shots.note)});
      } catch (e) {
        screenshotFailed.push(e.message);
      }
    }

    let md=makeMd(info);
    for(const [key,path] of replacements) md=md.split(key).join(path);
    if (failed.length) md+='\n\n## 图片下载失败清单\n\n'+failed.map(s=>'- '+s).join('\n')+'\n';
    if (flagged.length) md+='\n\n## 自动截图复核\n\n'+flagged.map(q=>`- 第${q.number}题：${questionWarnings(q).join('；')}`).join('\n')+'\n';
    entries.unshift({name:'试题.md',data:encoder.encode(md)}, {name:'试题.txt',data:encoder.encode(makeTxt(info).replace(/__EXT__/g,''))});
    entries.push({name:'导出说明.txt',data:encoder.encode(`题数：${info.questions.length}，页面标注：${info.count??'未知'}\n图片总数：${allImages.length}，图片下载失败：${failed.length}\n需复核题目：${flagged.length}，分页截图：${screenshotCount} 张，截图失败：${screenshotFailed.length}\n截图使用 html2canvas 根据网页 DOM 重新渲染；已尝试隐藏富文本答题编辑器、输入框和工具栏。跨域图片、DRM、部分 Canvas/iframe 或特殊 CSS 仍可能无法完整呈现。\n没有上传题目或提交答案。\n`)});
    if (screenshotFailed.length) entries.push({name:'截图失败清单.txt',data:encoder.encode(screenshotFailed.join('\n'))});
    save(filename(info.title)+'_图文.zip',buildZip(entries),'application/zip');
    return {imgCount:allImages.length, failed, screenshotCount, screenshotFailed};
  }

  // 题目质量检查：整题文本兜底、题干缺失、客观题选项缺失均进入“失败题截图”集合。
  function questionWarnings(q) {
    const warnings = [];
    const body = tidy(q.body || '');
    if (!body || body.includes('题干识别失败：')) warnings.push('题干缺失或无法识别');
    if (q.bodySource === '整题文本兜底') warnings.push('使用整题文本兜底，建议复核');
    if (/单选|多选|不定项|判断/.test(q.type) && q.options.length < 2 && !q.images.length) {
      warnings.push('客观题选项不足');
    }
    if (body.includes('题目主要内容为图片')) warnings.push('图片题，建议核对图片内容');
    return warnings;
  }

  function waitImage(img, timeout=3500) {
    if (img.complete) return Promise.resolve();
    return new Promise(resolve => {
      let done = false;
      const finish = () => { if (done) return; done = true; clearTimeout(timer); resolve(); };
      const timer = setTimeout(finish, timeout);
      img.addEventListener('load', finish, {once:true});
      img.addEventListener('error', finish, {once:true});
    });
  }

  function findCaptureContainer(info) {
    const roots = info.questions.map(q=>q.root).filter(el=>el && el.isConnected);
    if (!roots.length) throw new Error('没有可截图的题目节点');
    const preferred = [
      '.question-list', '.questionList', '.mark_list', '.markList', '.TiMuBox',
      '.work_content', '.workContent', '#workContent', '#workContentBox',
      '.work-main', '.main-content', 'main'
    ];
    for (const selector of preferred) {
      const candidates = [...document.querySelectorAll(selector)].filter(el=>roots.every(root=>el.contains(root)));
      if (candidates.length) return candidates.sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length)[0];
    }
    let ancestor = roots[0];
    while (ancestor && !roots.every(root=>ancestor.contains(root))) ancestor = ancestor.parentElement;
    return ancestor || document.body;
  }

  function editorCleanup(clonedRoot, selectedNumbers, marker) {
    const wrapperSelector = [
      '.edui-editor','.edui-editor-toolbar','.edui-toolbar','.ke-container','.tox-tinymce','.tox','.tox-toolbar',
      '.mce-tinymce','.mce-container','.mce-toolbar','.ql-toolbar','.ql-container',
      '.w-e-toolbar','.w-e-text-container','.simditor','.note-editor',
      '.answer-editor','.answerEditor','.answer-input','.answerInput',
      '.answer-box','.answerBox','.answer-area','.answerArea',
      '.editor-container','.editor-box','.editorBox','.editor-toolbar','.toolbar-container','.rich-text-editor',
      '.ue-editor','.UEditor','.wangEditor','.edit-area','.editArea'
    ].join(',');

    // 只保留本次需要截图的题目，避免失败题截图仍带上整页其他题目。
    const questionElements=[...(clonedRoot.matches('[data-cx-page-question]')?[clonedRoot]:[]),...clonedRoot.querySelectorAll('[data-cx-page-question]')];
    for (const qEl of questionElements) {
      const num = qEl.getAttribute('data-cx-page-question');
      if (!selectedNumbers.has(num)) qEl.style.setProperty('display','none','important');
    }

    clonedRoot.querySelectorAll(wrapperSelector).forEach(el=>el.style.setProperty('display','none','important'));

    // 处理没有标准 class 的富文本编辑器：隐藏 iframe、输入区及其较大的编辑器外壳。
    const controls = [...clonedRoot.querySelectorAll('iframe,textarea,[contenteditable="true"],input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"])')];
    for (const control of controls) {
      const src = (control.getAttribute('src') || '').toLowerCase();
      if (control.tagName === 'IFRAME' && /(video|player|bilibili|youku|v\.qq|tencent)/i.test(src)) continue;
      if (control.closest(wrapperSelector)) continue;
      let target = control;
      let parent = control.parentElement;
      for (let depth=0; parent && parent!==clonedRoot && depth<6; depth++, parent=parent.parentElement) {
        const r = parent.getBoundingClientRect();
        const cls = String(parent.className || '');
        const hasEditorControl = !!parent.querySelector('iframe,textarea,[contenteditable="true"]');
        if (/editor|answer|editarea|edit-area/i.test(cls) || (hasEditorControl && r.width>280 && r.height>90)) {
          target = parent;
          if (/editor|answer|editarea|edit-area/i.test(cls)) break;
        }
      }
      target.style.setProperty('display','none','important');
    }

    // 隐藏本脚本面板、固定悬浮工具和吸顶导航，避免它们出现在分页图中。
    clonedRoot.querySelectorAll(`#${PANEL_ID},#${PANEL_ID}-restore,[data-cx-export-ui]`).forEach(el=>el.style.setProperty('display','none','important'));
    for (const el of clonedRoot.querySelectorAll('*')) {
      const pos = clonedRoot.ownerDocument.defaultView.getComputedStyle(el).position;
      if ((pos==='fixed' || pos==='sticky') && !el.querySelector('[data-cx-page-question]')) {
        el.style.setProperty('display','none','important');
      }
    }

    // 清除动画、光标与编辑态装饰。
    const style = clonedRoot.ownerDocument.createElement('style');
    style.textContent = `
      *{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}
      [contenteditable="true"],textarea,input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"]){display:none!important}
    `;
    clonedRoot.ownerDocument.head.appendChild(style);
  }

  function makePageRanges(totalHeight, pageHeight, questionRects) {
    const ranges=[];
    let start=0;
    while (start < totalHeight-1) {
      let end=Math.min(totalHeight,start+pageHeight);
      if (end < totalHeight) {
        // 若分页线切进一题，且该题本身能完整放入一页，则把整题移到下一页。
        const crossing=questionRects
          .filter(q=>q.top < end-2 && q.bottom > end+2)
          .sort((a,b)=>a.top-b.top)[0];
        if (crossing && crossing.top > start + pageHeight*0.22 && (crossing.bottom-crossing.top) <= pageHeight) {
          end=Math.floor(crossing.top);
        }
      }
      if (end <= start+80) end=Math.min(totalHeight,start+pageHeight);
      ranges.push({top:start,bottom:end});
      start=end;
    }
    if (!ranges.length) ranges.push({top:0,bottom:totalHeight});
    return ranges;
  }

  async function blobBytes(canvas) {
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG编码失败')),'image/png'));
    return new Uint8Array(await blob.arrayBuffer());
  }

  async function capturePaginatedScreenshots(info, selectedQuestions, pageMode='screen') {
    const renderer=(typeof html2canvas==='function')?html2canvas:window.html2canvas;
    if (typeof renderer!=='function') throw new Error('截图组件未加载。请确认能访问 cdnjs.cloudflare.com，并重新打开页面。');
    const selected=selectedQuestions.filter(q=>q.root && q.root.isConnected);
    if (!selected.length) throw new Error('没有可截图的题目');
    const container=findCaptureContainer(info);
    if (!container || !container.isConnected) throw new Error('无法定位题目列表区域');

    const token=`cx-page-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const selectedNumbers=new Set(selected.map(q=>String(q.number)));
    const oldContainerMarker=container.getAttribute('data-cx-page-root');
    container.setAttribute('data-cx-page-root',token);
    const oldQuestionMarkers=[];
    info.questions.forEach(q=>{
      const el=q.root;
      oldQuestionMarkers.push([el,el.getAttribute('data-cx-page-question')]);
      el.setAttribute('data-cx-page-question',String(q.number));
    });
    try {
      const imgs=[...container.querySelectorAll('img')];
      imgs.forEach(img=>{if(img.loading==='lazy')img.loading='eager';});
      await Promise.all(imgs.map(img=>waitImage(img,5000)));

      let geometry=null;
      const widthHint=Math.max(container.scrollWidth||0,container.getBoundingClientRect().width||0,document.documentElement.clientWidth||0);
      const heightHint=Math.max(container.scrollHeight||0,container.getBoundingClientRect().height||0);
      if (widthHint<100 || heightHint<50) throw new Error('题目列表区域尺寸异常');
      // 统一以 1 倍 CSS 像素渲染，避免长作业一次生成超大画布。
      const canvas=await renderer(container,{
        backgroundColor:null,
        scale:1,
        useCORS:true,
        allowTaint:false,
        logging:false,
        imageTimeout:12000,
        windowWidth:Math.max(document.documentElement.clientWidth,widthHint),
        windowHeight:Math.max(window.innerHeight,heightHint),
        scrollX:window.scrollX||0,
        scrollY:window.scrollY||0,
        onclone(clonedDocument){
          const clonedRoot=clonedDocument.querySelector(`[data-cx-page-root="${token}"]`);
          if(!clonedRoot) return;
          clonedRoot.style.setProperty('max-height','none','important');
          clonedRoot.style.setProperty('height','auto','important');
          clonedRoot.style.setProperty('min-height','0','important');
          clonedRoot.style.setProperty('overflow','visible','important');
          clonedRoot.style.setProperty('position','relative','important');
          // 若题目列表位于内部滚动容器，展开克隆页中的滚动祖先，避免只渲染首屏。
          let ancestor=clonedRoot.parentElement;
          for(let depth=0;ancestor && ancestor!==clonedDocument.body && depth<8;depth++,ancestor=ancestor.parentElement){
            const cs=clonedDocument.defaultView.getComputedStyle(ancestor);
            if(/auto|scroll|hidden|clip/.test(`${cs.overflowY} ${cs.overflow}`)){
              ancestor.style.setProperty('overflow','visible','important');
              ancestor.style.setProperty('overflow-y','visible','important');
              ancestor.style.setProperty('max-height','none','important');
              if(ancestor.scrollHeight>ancestor.clientHeight+4) ancestor.style.setProperty('height','auto','important');
            }
          }
          editorCleanup(clonedRoot,selectedNumbers,token);
          const rootRect=clonedRoot.getBoundingClientRect();
          const questionRects=[];
          for(const q of selected){
            const selector=`[data-cx-page-question="${String(q.number)}"]`;
            const el=clonedRoot.matches(selector)?clonedRoot:clonedRoot.querySelector(selector);
            if(!el || clonedDocument.defaultView.getComputedStyle(el).display==='none') continue;
            const r=el.getBoundingClientRect();
            questionRects.push({number:q.number,top:Math.max(0,r.top-rootRect.top),bottom:Math.max(0,r.bottom-rootRect.top)});
          }
          geometry={
            width:Math.ceil(Math.max(clonedRoot.scrollWidth,rootRect.width)),
            height:Math.ceil(Math.max(clonedRoot.scrollHeight,rootRect.height)),
            questionRects
          };
        }
      });
      if(!canvas || !canvas.width || !canvas.height) throw new Error('截图画布为空');
      const cssWidth=geometry?.width || canvas.width;
      const expectedHeight=geometry?.height || canvas.height;
      if(expectedHeight>canvas.height+8) throw new Error(`分页截图只渲染到 ${canvas.height}px，但题目区域实际约 ${expectedHeight}px；页面可能存在未展开的内部滚动容器。请先尝试滚动页面到底部再导出，或提供“诊断”文件。`);
      const cssHeight=Math.min(expectedHeight,canvas.height);
      const pageHeight=pageMode==='a4'
        ? Math.max(700,Math.floor(cssWidth*297/210))
        : Math.max(600,Math.floor((window.innerHeight||900)*0.92));
      const ranges=makePageRanges(cssHeight,pageHeight,geometry?.questionRects||[]);
      const entries=[];
      const pageLines=[];
      for(let i=0;i<ranges.length;i++){
        const range=ranges[i];
        const top=Math.max(0,Math.floor(range.top*canvas.height/cssHeight));
        const bottom=Math.min(canvas.height,Math.max(top+1,Math.ceil(range.bottom*canvas.height/cssHeight)));
        const page=document.createElement('canvas');
        page.width=canvas.width;
        page.height=bottom-top;
        const ctx=page.getContext('2d');
        ctx.drawImage(canvas,0,top,canvas.width,bottom-top,0,0,canvas.width,bottom-top);
        const bytes=await blobBytes(page);
        const name=`screenshots/P${String(i+1).padStart(2,'0')}.png`;
        entries.push({name,data:bytes});
        const onPage=(geometry?.questionRects||[]).filter(q=>q.bottom>range.top && q.top<range.bottom).map(q=>`第${q.number}题`);
        pageLines.push(`${name}：${onPage.length?onPage.join('、'):'题目内容续页'}（页面纵向范围 ${Math.round(range.top)}–${Math.round(range.bottom)} px）`);
        page.width=1; page.height=1;
      }
      const note=[
        '学习通作业分页截图说明',
        `分页模式：${pageMode==='a4'?'A4纵向比例（约 210:297）':'网页可视区域高度'}`,
        `题目总数：${info.questions.length}`,
        `本次纳入截图：${selected.map(q=>q.number).join('、')}`,
        `截图页数：${entries.length}`,
        '答题编辑器、输入框和常见富文本工具栏已在截图副本中尝试隐藏。',
        '若某个网页使用特殊编辑器结构，仍可能需要根据诊断信息补充选择器。',
        '', '分页内容：', ...pageLines
      ].join('\n');
      return {entries,note,pageCount:entries.length};
    } finally {
      if(oldContainerMarker===null) container.removeAttribute('data-cx-page-root');
      else container.setAttribute('data-cx-page-root',oldContainerMarker);
      for(const [el,old] of oldQuestionMarkers){
        if(old===null) el.removeAttribute('data-cx-page-question');
        else el.setAttribute('data-cx-page-question',old);
      }
    }
  }

  async function exportQuestionScreenshots(info, mode, pageMode='screen') {
    const warnings=info.questions.map(q=>({q,warnings:questionWarnings(q)}));
    const selected=mode==='failed'?warnings.filter(x=>x.warnings.length).map(x=>x.q):info.questions;
    if(!selected.length){
      alert('没有检测到明显提取失败的题目。若要人工复核全部题目，请使用“网页分页”或“A4分页”。');
      return {captured:0,failed:0,skipped:true};
    }
    setStatus(`正在整理 ${selected.length} 道题目并生成分页截图…`);
    const shots=await capturePaginatedScreenshots(info,selected,pageMode);
    const entries=[...shots.entries,{name:'分页说明.txt',data:encoder.encode(shots.note)}];
    const warningLines=warnings.filter(x=>x.warnings.length).map(x=>
      `第${x.q.number}题（${x.q.type}）：${x.warnings.join('；')}\n${tidy(x.q.body).slice(0,1200)}`
    );
    entries.push({name:'提取质量检查.txt',data:encoder.encode(warningLines.length?warningLines.join('\n\n'):'未发现明显提取异常。')});
    entries.push({name:'试题文本备份.txt',data:encoder.encode(makeTxt(info))});
    save(filename(info.title)+(mode==='failed'?'_失败题分页截图':'_'+(pageMode==='a4'?'A4分页截图':'网页分页截图'))+'.zip',buildZip(entries),'application/zip');
    return {captured:shots.pageCount,failed:0,selected:selected.length};
  }

  let panel, statusEl, buttons=[], restoreButton;
  function setStatus(s) { if(statusEl) statusEl.textContent=s; }
  function setBusy(flag) { buttons.forEach(b=>b.disabled=flag); }
  function statusFrom(info) {
    const n=info.questions.length;
    const mismatch=info.count && n !== info.count;
    const bad=info.questions.filter(q=>q.body.includes('题干识别失败：') || (!q.body.trim() && !q.images.length));
    const fallback=info.questions.filter(q=>q.bodySource==='整题文本兜底').length;
    const readable=n-bad.length;
    return `识别 ${n}${info.count?`/${info.count}`:''} 题；正文可读 ${readable}/${n}${mismatch?'（数量不符）':''}${fallback?`；整题文本兜底 ${fallback} 题`:''}${bad.length?`；内容缺失题号：${bad.map(q=>q.number).join('、')}`:''}`;
  }
  function openDialog(info) {
    if(!info.questions.length) {
      alert('未找到题目。请确认已经进入网页版作业答题页面（dowork），等待加载完成后再试。'); return false;
    }
    const message=statusFrom(info);
    setStatus(message);
    const readable=info.questions.filter(q=>!q.body.includes('题干识别失败：') && (q.body.trim() || q.images.length)).length;
    if(readable===0) {
      alert(`没有提取到任何题目内容。\n${message}\n请使用“导出诊断”或提供当前页面截图，暂时不要把空文件交给 AI。`);
      return false;
    }
    if((info.count && info.questions.length!==info.count) || readable!==info.questions.length) {
      return confirm(`注意：${message}\n部分题目可能尚未加载或识别不完整。仍要导出当前内容吗？`);
    }
    return true;
  }
  function exportDiagnostic() {
    const selectors = [
      'div[id^="question"].questionLi', '.questionLi', '.singleQuesId', '.TiMu.newTiMu',
      '.mark_item', 'div[id^="question"]', '.TiMu', 'h3.mark_name', '.stem',
      '.stem_answer .answerBg', 'ul.mark_letter > li', '.answerBg'
    ];
    const roots = locateQuestions();
    const lines = [
      '学习通作业导出诊断',
      `页面标题：${document.title}`,
      `页面地址：${location.origin + location.pathname}`,
      `页面标注题量：${expectedCount() ?? '未识别'}`,
      `当前识别容器数：${roots.length}`,
      '', '选择器命中数量：',
      ...selectors.map(sel => `${sel} => ${document.querySelectorAll(sel).length}`),
      '', '前3道题的 DOM 结构（仅本地导出，不会上传）：'
    ];
    roots.slice(0, 3).forEach((root, i) => {
      lines.push(`\n========== 题目容器 ${i + 1} ==========`);
      lines.push(`id: ${root.id || ''}`);
      lines.push(`class: ${root.className || ''}`);
      lines.push('innerText:');
      lines.push(visibleText(root).slice(0, 5000) || '[空]');
      lines.push('outerHTML:');
      lines.push(String(root.outerHTML || '').slice(0, 18000) || '[空]');
    });
    save('chaoxing-export-diagnostic.txt', '\ufeff' + lines.join('\n'), 'text/plain;charset=utf-8');
    setStatus(`已导出诊断；识别到 ${roots.length} 个题目容器。诊断文件只保存在本地。`);
  }

  async function action(kind) {
    setBusy(true);
    try {
      if (kind==='diag') { exportDiagnostic(); return; }
      setStatus('正在识别页面…');
      const info=parse();
      if(!openDialog(info)) return;
      if (kind==='failshot' || kind==='screenpages' || kind==='a4pages') {
        const pageMode=kind==='a4pages'?'a4':'screen';
        const result=await exportQuestionScreenshots(info,kind==='failshot'?'failed':'all',pageMode);
        if(!result.skipped) setStatus(`分页截图完成：${result.captured} 张；纳入 ${result.selected} 道题。${kind==='failshot'?'仅包含失败/需复核题目':pageMode==='a4'?'A4纵向比例':'按网页可视区域高度'}`);
      } else if (kind==='txt') {
        save(filename(info.title)+'_试题.txt', '\ufeff'+makeTxt(info),'text/plain;charset=utf-8');
        setStatus(`已下载 TXT；${statusFrom(info)}`);
      } else if (kind==='zip') {
        const img=await toZip(info);
        setStatus(`已下载 ZIP；${statusFrom(info)}；图片${img.imgCount}张（失败${img.failed.length}）；需复核题截图${img.screenshotCount}张（失败${img.screenshotFailed.length}）`);
      } else {
        setStatus(`${statusFrom(info)}；图片标签 ${info.questions.reduce((s,q)=>s+q.images.length,0)} 个`);
      }
    } catch(e) {
      console.error('[学习通导出]',e);
      setStatus(`导出失败：${e.message}`);
      alert('导出失败：'+e.message);
    } finally {setBusy(false);}
  }

  function mount() {
    if(document.getElementById(PANEL_ID)||!document.body) return;
    panel=document.createElement('div'); panel.id=PANEL_ID;
    Object.assign(panel.style,{position:'fixed',top:'68px',right:'16px',zIndex:'2147483647',background:'#10263d',color:'white',border:'1px solid #4d8fea',borderRadius:'10px',padding:'9px',font:'13px Arial,sans-serif',boxShadow:'0 4px 18px #0008',maxWidth:'480px'});
    const header=document.createElement('div');
    header.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:7px';
    const head=document.createElement('div'); head.textContent='学习通 · 本地试题导出'; head.style.cssText='font-weight:bold'; header.appendChild(head);
    const hide=document.createElement('button'); hide.type='button'; hide.textContent='×'; hide.title='隐藏导出面板'; hide.setAttribute('aria-label','隐藏导出面板');
    hide.style.cssText='border:0;background:transparent;color:#d7eaff;font-size:20px;line-height:20px;padding:0 5px;cursor:pointer';
    hide.addEventListener('click',()=>{panel.style.display='none';if(restoreButton)restoreButton.style.display='block';});
    header.appendChild(hide); panel.appendChild(header);
    const row=document.createElement('div'); row.style.cssText='display:flex;flex-wrap:wrap;gap:6px';panel.appendChild(row);
    for(const [name,k] of [['检查','check'],['文字 TXT','txt'],['图文 ZIP','zip'],['失败题分页','failshot'],['网页分页','screenpages'],['A4分页','a4pages'],['诊断','diag']]) {
      const b=document.createElement('button');b.textContent=name;b.type='button';
      b.style.cssText='border:0;border-radius:6px;background:#1974d2;color:white;padding:7px 9px;cursor:pointer;font-size:12px';
      b.addEventListener('click',()=>action(k));row.appendChild(b);buttons.push(b);
    }
    statusEl=document.createElement('div');statusEl.textContent='仅提取已加载题目；分页截图会尝试排除答题编辑器';statusEl.style.cssText='margin-top:7px;color:#c4dfff;font-size:12px;line-height:1.4;word-break:break-all';panel.appendChild(statusEl);
    document.body.appendChild(panel);

    restoreButton=document.createElement('button');
    restoreButton.id=PANEL_ID+'-restore';
    restoreButton.type='button';
    restoreButton.textContent='试题导出';
    restoreButton.title='打开学习通试题导出工具';
    restoreButton.setAttribute('data-cx-export-ui','1');
    restoreButton.style.cssText='display:none;position:fixed;right:16px;bottom:18px;z-index:2147483647;border:1px solid #4d8fea;border-radius:18px;background:#145fae;color:#fff;padding:9px 13px;font:13px Arial,sans-serif;box-shadow:0 3px 12px #0008;cursor:pointer';
    restoreButton.addEventListener('click',()=>{panel.style.display='block';restoreButton.style.display='none';});
    document.body.appendChild(restoreButton);
  }

  mount();
  document.addEventListener('DOMContentLoaded',mount,{once:true});
  setTimeout(mount,1500);
})();