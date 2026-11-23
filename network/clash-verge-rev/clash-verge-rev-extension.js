// Clash Verge Rev 扩展脚本
// 版本：2026-11-24.1 成人网站国家粘性分流与 GitHub 下载补全
// 目标：真实节点筛选、业务分层、URLTest 自动择优、国内直连、未知国际默认代理。
// 注意：URLTest 仅按指定健康检查 URL 的响应延迟择优，不代表吞吐量或丢包率。
// 仅重建 proxy-groups 和 rules，不修改机场原始 proxies、DNS、TUN、订阅地址。

function main(config, profileName) {
  if (!config || typeof config !== "object") {
    throw new Error("订阅配置不存在或格式错误");
  }
  if (!Array.isArray(config.proxies) || config.proxies.length === 0) {
    throw new Error("订阅没有内联 proxies 节点；当前脚本不支持仅使用 proxy-providers 的订阅格式。");
  }

  const unique = values => [...new Set(values.filter(v => typeof v === "string" && v.length > 0))];

  // 只接受真实代理协议，并检查 server / port。
  // 这样策略组名称、占位文字和订阅提示不会进入自动测速池。
  const supportedTypes = new Set([
    "ss", "ssr", "shadowsocks", "vmess", "vless", "trojan",
    "hysteria", "hysteria2", "tuic", "wireguard",
    "socks", "socks5", "http", "https", "snell", "ssh",
    "mieru", "anytls", "naive", "shadowtls", "juicity"
  ]);

  const noticePattern =
    /请开启|请更新|更新订阅|订阅到期|剩余流量|流量剩余|官网地址|购买套餐|套餐到期|过期提醒|联系客服|客服地址|公告节点|流量重置|订阅通知|自动选择|节点选择|负载均衡|故障转移|已过期/i;

  function isRealProxy(p) {
    if (!p || typeof p.name !== "string" || !p.name.trim()) return false;
    const type = String(p.type || "").toLowerCase();
    const server = typeof p.server === "string" ? p.server.trim() : "";
    const port = Number(p.port);
    return supportedTypes.has(type) &&
      server.length > 0 &&
      Number.isInteger(port) &&
      port > 0 &&
      port <= 65535 &&
      !noticePattern.test(p.name);
  }

  const nodeObjects = config.proxies.filter(isRealProxy);
  const nodes = unique(nodeObjects.map(p => p.name));

  if (nodes.length === 0) {
    throw new Error("没有筛选到有效代理节点。为避免生成错误配置，本次订阅更新已中止。");
  }

  // 地区识别只用于分组，不修改机场原始节点名称。
  const regionPatterns = {
    US: [/🇺🇸/, /\bUSA\b/i, /\bUS\b/i, /UNITED\s*STATES|AMERICA|美国/i],
    TW: [/🇹🇼/, /\bTW\b/i, /TAIWAN|台湾/i],
    SG: [/🇸🇬/, /\bSG\b/i, /SINGAPORE|新加坡|狮城/i],
    JP: [/🇯🇵/, /\bJP\b/i, /JAPAN|日本/i],
    KR: [/🇰🇷/, /\bKR\b/i, /KOREA|韩国|首尔/i],
    GB: [/🇬🇧/, /\bGB\b/i, /\bUK\b/i, /UNITED\s*KINGDOM|BRITAIN|ENGLAND|英国/i],
    HK: [/🇭🇰/, /\bHK\b/i, /HONG\s*KONG|香港/i],
    MO: [/🇲🇴/, /\bMO\b/i, /MACAU|MACAO|澳门/i],
    RU: [/🇷🇺/, /\bRU\b/i, /RUSSIA|俄罗斯|莫斯科/i],
    MY: [/🇲🇾/, /\bMY\b/i, /MALAYSIA|马来西亚/i],
    PH: [/🇵🇭/, /\bPH\b/i, /PHILIPPINES|菲律宾/i],
    TH: [/🇹🇭/, /\bTH\b/i, /THAILAND|泰国/i],
    IN: [/🇮🇳/, /\bIN\b/i, /INDIA|印度(?!尼西亚)/i],
    ID: [/🇮🇩/, /\bID\b/i, /INDONESIA|印度尼西亚|印尼/i],
    VN: [/🇻🇳/, /\bVN\b/i, /VIETNAM|越南/i],
    DE: [/🇩🇪/, /\bDE\b/i, /GERMANY|德国/i],
    FR: [/🇫🇷/, /\bFR\b/i, /FRANCE|法国/i],
    NL: [/🇳🇱/, /\bNL\b/i, /NETHERLANDS|荷兰/i],
    CA: [/🇨🇦/, /\bCA\b/i, /CANADA|加拿大/i],
    AU: [/🇦🇺/, /\bAU\b/i, /AUSTRALIA|澳大利亚|澳洲/i],
    ES: [/🇪🇸/, /\bES\b/i, /SPAIN|西班牙/i],
    IT: [/🇮🇹/, /\bIT\b/i, /ITALY|意大利/i],
    CH: [/🇨🇭/, /\bCH\b/i, /SWITZERLAND|瑞士/i],
    AT: [/🇦🇹/, /\bAT\b/i, /AUSTRIA|奥地利/i],
    BE: [/🇧🇪/, /\bBE\b/i, /BELGIUM|比利时/i],
    PL: [/🇵🇱/, /\bPL\b/i, /POLAND|波兰/i],
    SE: [/🇸🇪/, /\bSE\b/i, /SWEDEN|瑞典/i],
    NO: [/🇳🇴/, /\bNO\b/i, /NORWAY|挪威/i],
    FI: [/🇫🇮/, /\bFI\b/i, /FINLAND|芬兰/i],
    IE: [/🇮🇪/, /\bIE\b/i, /IRELAND|爱尔兰/i],
    TR: [/🇹🇷/, /\bTR\b/i, /TURKEY|TURKIYE|土耳其/i],
    BR: [/🇧🇷/, /\bBR\b/i, /BRAZIL|巴西/i],
    MX: [/🇲🇽/, /\bMX\b/i, /MEXICO|墨西哥/i],
    AR: [/🇦🇷/, /\bAR\b/i, /ARGENTINA|阿根廷/i],
    CN: [/🇨🇳/, /\bCN\b/i, /CHINA|中国大陆|大陆节点|中国节点/i]
  };

  function hasRegion(name, region) {
    return (regionPatterns[region] || []).some(re => re.test(name));
  }

  function pickOrdered(regions) {
    return unique(regions.flatMap(region => nodes.filter(name => hasRegion(name, region))));
  }

  // 自动池额外排除“裸域名式”节点名称（例如 congyu.org 🐱）。
  // 这类条目仍保留在手动列表；不因名称特殊就把它当成假节点删除。
  function pickAutoOrdered(regions) {
    return pickOrdered(regions).filter(name => !/[a-z0-9-]+\.[a-z]{2,}(?:\b|$)/i.test(name));
  }

  // 手动池保留可用的地区节点；自动池只纳入明确识别地区的真实节点。
  // GPT 候选地区顺序：美国 -> 新加坡 -> 台湾 -> 日本 -> 韩国 -> 英国。
  // URLTest 会按 ChatGPT 站点探测延迟择优；该顺序主要影响延迟相同及备用 Fallback。
  const gptManual = pickOrdered(["US", "SG", "TW", "JP", "KR", "GB"]);
  const gptAuto = pickAutoOrdered(["US", "SG", "TW", "JP", "KR", "GB"]);

  const googleManual = pickOrdered(["US", "SG", "JP", "TW", "HK", "KR", "GB"]);
  // Google 自动固定优先级：美国 -> 新加坡 -> 日本。
  // 这是稳定优先，不是最低延迟；香港/台湾保留手动，避免重复遇到地区服务差异。
  const googleAuto = pickAutoOrdered(["US", "SG", "JP"]);

  const tiktokManual = pickOrdered(["SG", "TW", "US", "PH"]);
  const tiktokAuto = pickAutoOrdered(["SG", "TW", "US", "PH"]);

  const russianManual = pickOrdered(["RU"]);
  const russianAuto = pickAutoOrdered(["RU"]);

  const onedriveManual = pickOrdered(["JP", "SG", "US", "TW", "KR", "GB", "MY", "PH", "TH", "IN", "ID", "VN", "HK"]);
  const onedriveAuto = pickAutoOrdered(["JP", "SG", "US", "KR", "GB", "TW", "MY", "PH", "TH", "IN", "ID", "VN"]);

  const steamManual = pickOrdered(["JP", "SG", "US", "GB", "HK", "TW"]);
  const steamAuto = pickAutoOrdered(["JP", "SG", "US", "GB", "HK"]);

  // 国际手动组保留全部非中国节点（包括地区未知节点）。
  // 国际自动组只纳入明确识别的地区，排除香港、俄罗斯、中国及地区不明节点。
  const intlManual = nodes.filter(name => !hasRegion(name, "CN"));
  const intlAuto = pickAutoOrdered([
    "JP", "SG", "TW", "US", "KR", "GB", "DE", "NL",
    "CA", "AU", "MY", "PH", "TH", "IN", "ID", "VN"
  ]);

  // GitHub：自动池纳入明确识别的海外真实节点；手动池保留全部非中国节点。
  // GitHub 首页 HTTP 200 仅检查基础出口可达性，不等于 Git clone/API/LFS 全链路测试。
  const githubManual = nodes.filter(name => !hasRegion(name, "CN"));
  const githubAuto = pickAutoOrdered([
    "HK", "MO", "TW", "JP", "SG", "US", "KR", "GB", "DE", "NL",
    "CA", "AU", "MY", "PH", "TH", "IN", "ID", "VN"
  ]);

  // Bilibili：只允许手动选择港澳台节点；默认 DIRECT，不建立自动测速或自动切换。
  const bilibiliManual = pickOrdered(["HK", "MO", "TW"]);

  // 成人网站：国家内 URLTest 自动择优；跨国家不自动回退，避免 Cloudflare 会话因地区变化反复挑战。
  // 所有国家池均 lazy:false，未选中的国家也持续健康检查，减少切换国家时遇到陈旧/未测速节点。
  // 默认国家按可识别节点数量最多者选择；数量相同时按 JP -> HK -> TW -> SG -> US ... 的顺序。
  const adultRegionMeta = [
    ["JP", "日本"], ["HK", "香港"], ["TW", "台湾"], ["SG", "新加坡"],
    ["KR", "韩国"], ["US", "美国"], ["GB", "英国"], ["DE", "德国"],
    ["NL", "荷兰"], ["CA", "加拿大"], ["AU", "澳大利亚"], ["MO", "澳门"],
    ["MY", "马来西亚"], ["PH", "菲律宾"], ["TH", "泰国"], ["IN", "印度"],
    ["ID", "印度尼西亚"], ["VN", "越南"], ["RU", "俄罗斯"], ["FR", "法国"],
    ["ES", "西班牙"], ["IT", "意大利"], ["CH", "瑞士"], ["AT", "奥地利"],
    ["BE", "比利时"], ["PL", "波兰"], ["SE", "瑞典"], ["NO", "挪威"],
    ["FI", "芬兰"], ["IE", "爱尔兰"], ["TR", "土耳其"], ["BR", "巴西"],
    ["MX", "墨西哥"], ["AR", "阿根廷"]
  ];
  const adultRegionPools = adultRegionMeta
    .map(([region, label], priority) => ({
      region,
      label,
      priority,
      groupName: "♻️ 成人" + label + "自动",
      nodes: pickAutoOrdered([region])
    }))
    .filter(item => item.nodes.length > 0);
  const adultManual = nodes.filter(name => !hasRegion(name, "CN"));
  const adultDefaultRegion = [...adultRegionPools].sort(
    (a, b) => b.nodes.length - a.nodes.length || a.priority - b.priority
  )[0];
  const adultDefaultGroup = adultDefaultRegion
    ? adultDefaultRegion.groupName
    : (adultManual.length ? "🖐 成人手动" : "REJECT");

  const groups = [];

  function addService(label, autoName, autoType, autoNodes, manualNodes, health) {
    const candidates = unique(autoNodes);
    const manual = unique(manualNodes);

    if (candidates.length > 0) {
      const autoGroup = {
        name: autoName,
        type: autoType,
        proxies: candidates,
        url: health.url,
        interval: health.interval || 300,
        timeout: health.timeout || 8000,
        lazy: health.lazy === undefined ? true : health.lazy,
        hidden: true,
      };

      if (health.maxFailedTimes !== undefined) {
        autoGroup["max-failed-times"] = health.maxFailedTimes;
      }

      if (health.expectedStatus) {
        autoGroup["expected-status"] = health.expectedStatus;
      }
      if (autoType === "url-test") {
        autoGroup.tolerance = health.tolerance === undefined ? 80 : health.tolerance;
      }
      groups.push(autoGroup);
    }

    const options = unique([
      ...(candidates.length ? [autoName] : []),
      ...manual
    ]);
    if (options.length === 0) options.push("REJECT");

    groups.push({
      name: label,
      type: "select",
      proxies: options,
      "default-selected": candidates.length ? autoName : options[0]
    });
  }

  // GPT 使用双自动策略，但把手动节点收进独立子组，避免顶层选择器误选单节点后绕过自动组。
  // 主自动组：URLTest 以 ChatGPT 主页 HTTP 200 探测结果择优；60 秒刷新，100ms 容差抑制小幅抖动。
  // 备用自动组：Fallback 按 US -> SG -> TW -> JP -> KR -> GB 顺序选择第一个健康节点。
  // 两组都只验证 ChatGPT 主页可达性，不等价于 WebSocket Upgrade 或模型 SSE 长连接测试。
  function addChatGPTService(autoNodes, manualNodes) {
    const candidates = unique(autoNodes);
    const manual = unique(manualNodes);

    if (candidates.length > 0) {
      groups.push({
        name: "♻️ GPT自动",
        type: "url-test",
        proxies: candidates,
        url: "https://chatgpt.com/",
        interval: 60,
        timeout: 2500,
        lazy: false,
        "max-failed-times": 1,
        "expected-status": "200",
        tolerance: 100,
        hidden: true,
      });

      groups.push({
        name: "🛟 GPT故障转移",
        type: "fallback",
        proxies: candidates,
        url: "https://chatgpt.com/",
        interval: 30,
        timeout: 2500,
        lazy: true,
        "max-failed-times": 1,
        "expected-status": "200",
        hidden: true,
      });
    }

    if (manual.length > 0) {
      groups.push({
        name: "🖐 GPT手动",
        type: "select",
        proxies: manual,
        "default-selected": manual[0],
      });
    }

    const options = unique([
      ...(candidates.length > 0 ? ["♻️ GPT自动", "🛟 GPT故障转移"] : []),
      ...(manual.length > 0 ? ["🖐 GPT手动"] : []),
    ]);
    if (options.length === 0) options.push("REJECT");

    groups.push({
      name: "💬 ChatGPT",
      type: "select",
      proxies: options,
      "default-selected": candidates.length > 0 ? "♻️ GPT自动" : options[0],
    });
  }

  addChatGPTService(gptAuto, gptManual);

  // GitHub：专用 URLTest，60 秒检测；GitHub 相关域名统一使用同一策略组。
  addService(
    "🐙 GitHub", "♻️ GitHub自动", "url-test", githubAuto, githubManual,
    { url: "https://github.com/", expectedStatus: "200", interval: 60, timeout: 5000, tolerance: 100, maxFailedTimes: 1, lazy: true }
  );

  // Google：高频检查、较短超时、单次失败后主动复检；保留美国/新加坡/日本自动池，台湾/香港仍可手动选择。
  addService(
    "🌐 Google", "♻️ Google自动", "url-test", googleAuto, googleManual,
    { url: "https://www.google.com/generate_204", expectedStatus: "204", interval: 60, timeout: 5000, tolerance: 100, maxFailedTimes: 1, lazy: true }
  );

  addService(
    "📱 TikTok", "♻️ TikTok自动", "url-test", tiktokAuto, tiktokManual,
    { url: "https://www.tiktok.com/", expectedStatus: "200/301/302", interval: 90, timeout: 5000, tolerance: 80, maxFailedTimes: 1, lazy: true }
  );

  addService(
    "🪆 俄站", "♻️ 俄站自动", "url-test", russianAuto, russianManual,
    { url: "https://yandex.ru/", expectedStatus: "200/301/302", interval: 120, timeout: 5000, tolerance: 80, maxFailedTimes: 1, lazy: true }
  );

  addService(
    "☁️ OneDrive", "♻️ OneDrive自动", "url-test", onedriveAuto, onedriveManual,
    { url: "https://onedrive.live.com/", expectedStatus: "200/301/302", interval: 90, timeout: 5000, tolerance: 80, maxFailedTimes: 1, lazy: true }
  );

  addService(
    "🎮 Steam", "♻️ Steam自动", "url-test", steamAuto, steamManual,
    { url: "https://store.steampowered.com/", expectedStatus: "200/301/302", interval: 120, timeout: 5000, tolerance: 80, maxFailedTimes: 1, lazy: true }
  );

  groups.push({
    name: "🇨🇳 国内直连",
    type: "select",
    proxies: ["DIRECT"],
    "default-selected": "DIRECT"
  });

  // Bilibili：规则模式下始终命中此选择器；默认 DIRECT，手动选择港澳台节点后才走代理。
  groups.push({
    name: "📺 哔哩哔哩",
    type: "select",
    proxies: unique(["DIRECT", ...bilibiliManual]),
    "default-selected": "DIRECT"
  });

  // 成人网站：国家内 URLTest，持续检测所有国家候选；跨国家切换由用户手动决定。
  // 使用 Cloudflare 官方 204 连通性端点；它只验证 Cloudflare 网络可达，不代表 R34 对该 IP 一定免挑战。
  for (const region of adultRegionPools) {
    groups.push({
      name: region.groupName,
      type: "url-test",
      proxies: region.nodes,
      url: "https://cp.cloudflare.com/generate_204",
      interval: 60,
      timeout: 5000,
      lazy: false,
      "max-failed-times": 1,
      "expected-status": "204",
      tolerance: 150,
      hidden: true
    });
  }

  if (adultManual.length > 0) {
    groups.push({
      name: "🖐 成人手动",
      type: "select",
      proxies: adultManual,
      "default-selected": adultManual[0],
      hidden: true
    });
  }

  const adultOptions = unique([
    ...adultRegionPools.map(region => region.groupName),
    ...(adultManual.length ? ["🖐 成人手动"] : [])
  ]);
  groups.push({
    name: "🔞 成人网站",
    type: "select",
    proxies: adultOptions.length ? adultOptions : ["REJECT"],
    "default-selected": adultDefaultGroup
  });

  // 国际默认：兜底组使用高频健康检查，避免未知国际站点长期留在失效出口。
  addService(
    "🌍 国际默认", "♻️ 国际自动", "url-test", intlAuto, intlManual,
    { url: "https://www.gstatic.com/generate_204", expectedStatus: "204", interval: 60, timeout: 5000, tolerance: 100, maxFailedTimes: 1, lazy: true }
  );

  // 完全重建策略组，避免机场模板组（Emby、iQiyi、Disney 等）重新出现。
  config["proxy-groups"] = groups;

  const GPT = "💬 ChatGPT";
  const GITHUB = "🐙 GitHub";
  const BILIBILI = "📺 哔哩哔哩";
  const GOOGLE = "🌐 Google";
  const TIKTOK = "📱 TikTok";
  const RU = "🪆 俄站";
  const ONEDRIVE = "☁️ OneDrive";
  const STEAM = "🎮 Steam";
  const CN = "🇨🇳 国内直连";
  const INTL = "🌍 国际默认";
  const ADULT = "🔞 成人网站";

  const adultDomains = [
    // 成人视频站与其已确认的媒体 CDN。
    "pornhub.com", "pornhubpremium.com", "phncdn.com", "phprcdn.com",
    "redtube.com", "tube8.com", "youporn.com", "ypncdn.com",
    "xvideos.com", "xvideos-cdn.com", "xnxx.com",
    "xhamster.com", "xhamster.desi", "xhamsterlive.com", "xhamsterpremium.com", "xhcdn.com",
    "spankbang.com", "eporner.com", "beeg.com", "tnaflix.com", "youjizz.com",
    "erome.com", "motherless.com", "redgifs.com", "rule34video.com",
    "adulttime.com", "brazzers.com", "realitykings.com", "bangbros.com",
    "naughtyamerica.com", "mofos.com", "digitalplayground.com", "blacked.com",
    "teamskeet.com", "evilangel.com", "vixen.com", "deeper.com", "bellesa.co", "porn.com",
    // 创作者订阅与成人直播平台。
    "onlyfans.com", "onlyfansusercontent.com", "fansly.com", "manyvids.com",
    "justfor.fans", "fancentro.com", "loyalfans.com", "fanvue.com",
    "chaturbate.com", "stripchat.com", "bongacams.com", "livejasmin.com",
    "cam4.com", "myfreecams.com", "mfcimg.com", "camsoda.com",
    "streamate.com", "flirt4free.com", "imlive.com", "jerkmate.com", "xlovecam.com",
    // 成人图片、插画与标签图库。
    "rule34.xxx", "rule34.paheal.net", "rule34vault.com", "gelbooru.com",
    "danbooru.donmai.us", "donmai.us", "e621.net", "xbooru.com", "tbib.org",
    "hypnohub.net", "yande.re", "konachan.com", "realbooru.com",
    "sankakucomplex.com", "hentai-foundry.com",
    // 成人漫画、动画与视频。
    "nhentai.net", "hitomi.la", "e-hentai.org", "exhentai.org",
    "hentai2read.com", "hentaifox.com", "hentaihaven.xxx", "fakku.net",
    "hanime.tv", "hanime1.me",
    // 成人音频与 ASMR；DLsite 为混合目录，整站会统一走该组。
    "asmr.one", "japaneseasmr.com", "eroasmr.com", "hentaiasmr.moe",
    "asmrhoney.com", "audiodesires.com", "erovoice.us", "ohcleo.com",
    "asmrfantasy.com", "dlsite.com", "dlsite.jp"
  ];

  config.rules = [
    // GitHub：网页、REST API、Raw、Release、资源文件及 Pages 统一走专用策略组。
    "DOMAIN-SUFFIX,github.com," + GITHUB,
    "DOMAIN-SUFFIX,githubusercontent.com," + GITHUB,
    "DOMAIN-SUFFIX,githubassets.com," + GITHUB,
    "DOMAIN-SUFFIX,github.io," + GITHUB,
    "DOMAIN-SUFFIX,github.dev," + GITHUB,
    "DOMAIN-SUFFIX,githubpreview.dev," + GITHUB,
    "DOMAIN-SUFFIX,githubstatus.com," + GITHUB,
    "DOMAIN-SUFFIX,github.community," + GITHUB,
    "DOMAIN-SUFFIX,github.blog," + GITHUB,
    "DOMAIN-SUFFIX,githubcopilot.com," + GITHUB,
    "DOMAIN-SUFFIX,github-cloud.s3.amazonaws.com," + GITHUB,
    "DOMAIN,github-production-release-asset-2e65be.s3.amazonaws.com," + GITHUB,
    "DOMAIN,github-production-repository-file-5c1aeb.s3.amazonaws.com," + GITHUB,
    "DOMAIN,github-production-user-asset-6210df.s3.amazonaws.com," + GITHUB,

    // Bilibili：必须排在 GEOSITE,CN / GEOIP,CN 之前，才能在规则模式下手动切换港澳台出口。
    "DOMAIN,apiintl.biliapi.net," + BILIBILI,
    "DOMAIN,upos-hz-mirrorakam.akamaized.net," + BILIBILI,
    "DOMAIN-SUFFIX,acg.tv," + BILIBILI,
    "DOMAIN-SUFFIX,acgvideo.com," + BILIBILI,
    "DOMAIN-SUFFIX,b23.tv," + BILIBILI,
    "DOMAIN-SUFFIX,bigfun.cn," + BILIBILI,
    "DOMAIN-SUFFIX,bigfunapp.cn," + BILIBILI,
    "DOMAIN-SUFFIX,biliapi.com," + BILIBILI,
    "DOMAIN-SUFFIX,biliapi.net," + BILIBILI,
    "DOMAIN-SUFFIX,bilibili.co," + BILIBILI,
    "DOMAIN-SUFFIX,bilibili.com," + BILIBILI,
    "DOMAIN-SUFFIX,bilibili.tv," + BILIBILI,
    "DOMAIN-SUFFIX,biligame.com," + BILIBILI,
    "DOMAIN-SUFFIX,biligame.net," + BILIBILI,
    "DOMAIN-SUFFIX,biliimg.com," + BILIBILI,
    "DOMAIN-SUFFIX,biliintl.co," + BILIBILI,
    "DOMAIN-SUFFIX,bilivideo.cn," + BILIBILI,
    "DOMAIN-SUFFIX,bilivideo.com," + BILIBILI,
    "DOMAIN-SUFFIX,hdslb.com," + BILIBILI,
    "DOMAIN-SUFFIX,im9.com," + BILIBILI,

    // 成人网站：只收录成人导向站点及确认的内容 CDN，不把 Reddit / X / Pixiv 等混合平台整站纳入。
    ...adultDomains.map(domain => "DOMAIN-SUFFIX," + domain + "," + ADULT),

    // ChatGPT / OpenAI：主站、认证、Cloudflare 验证、WorkOS 等尽量固定同一出口。
    "DOMAIN,ws.chatgpt.com," + GPT,
    "DOMAIN-SUFFIX,chatgpt.com," + GPT,
    "DOMAIN-SUFFIX,chat.openai.com," + GPT,
    "DOMAIN-SUFFIX,openai.com," + GPT,
    "DOMAIN-SUFFIX,oaistatic.com," + GPT,
    "DOMAIN-SUFFIX,oaiusercontent.com," + GPT,
    "DOMAIN-SUFFIX,oaistatsig.com," + GPT,
    "DOMAIN-SUFFIX,openaimerge.com," + GPT,
    "DOMAIN-SUFFIX,auth.openai.com," + GPT,
    "DOMAIN-SUFFIX,workos.com," + GPT,
    "DOMAIN-SUFFIX,workoscdn.com," + GPT,
    "DOMAIN-SUFFIX,workos.imgix.net," + GPT,
    "DOMAIN-SUFFIX,ct.sendgrid.net," + GPT,
    "DOMAIN-SUFFIX,intercom.io," + GPT,
    "DOMAIN-SUFFIX,intercomcdn.com," + GPT,
    "DOMAIN,challenges.cloudflare.com," + GPT,
    "DOMAIN,js.stripe.com," + GPT,
    "DOMAIN,humb.apple.com," + GPT,
    "DOMAIN,rum.browser-intake.datadoghq.com," + GPT,
    "DOMAIN,o207216.ingest.sentry.io," + GPT,
    "DOMAIN,o33249.ingest.sentry.io," + GPT,
    "DOMAIN-KEYWORD,openai," + GPT,
    "DOMAIN-KEYWORD,chatgpt," + GPT,

    // Google / Gemini / YouTube：优先专用组，避免被国际默认规则抢先匹配。
    "DOMAIN,ai.google.dev," + GOOGLE,
    "DOMAIN,makersuite.google.com," + GOOGLE,
    "DOMAIN-SUFFIX,google.com," + GOOGLE,
    "DOMAIN-SUFFIX,google.com.hk," + GOOGLE,
    "DOMAIN-SUFFIX,googleapis.com," + GOOGLE,
    "DOMAIN-SUFFIX,googleusercontent.com," + GOOGLE,
    "DOMAIN-SUFFIX,gstatic.com," + GOOGLE,
    "DOMAIN-SUFFIX,ggpht.com," + GOOGLE,
    "DOMAIN-SUFFIX,googlevideo.com," + GOOGLE,
    "DOMAIN-SUFFIX,youtube.com," + GOOGLE,
    "DOMAIN-SUFFIX,youtube-nocookie.com," + GOOGLE,
    "DOMAIN-SUFFIX,youtu.be," + GOOGLE,
    "DOMAIN-SUFFIX,ytimg.com," + GOOGLE,
    "DOMAIN-SUFFIX,gvt1.com," + GOOGLE,
    "DOMAIN-SUFFIX,deepmind.com," + GOOGLE,
    "DOMAIN-SUFFIX,deepmind.google," + GOOGLE,
    "DOMAIN-SUFFIX,generativeai.google," + GOOGLE,
    "DOMAIN-KEYWORD,generativelanguage," + GOOGLE,
    "DOMAIN-KEYWORD,youtube," + GOOGLE,
    "DOMAIN-KEYWORD,google," + GOOGLE,

    // TikTok
    "DOMAIN-SUFFIX,tiktok.com," + TIKTOK,
    "DOMAIN-SUFFIX,tiktokv.com," + TIKTOK,
    "DOMAIN-SUFFIX,tiktokcdn.com," + TIKTOK,
    "DOMAIN-SUFFIX,tiktokcdn-us.com," + TIKTOK,
    "DOMAIN-SUFFIX,musical.ly," + TIKTOK,
    "DOMAIN-SUFFIX,byteoversea.com," + TIKTOK,
    "DOMAIN-SUFFIX,ibytedtos.com," + TIKTOK,
    "DOMAIN-KEYWORD,tiktok," + TIKTOK,

    // 俄站：严格使用俄罗斯节点，不自动回退到其他国家。
    "DOMAIN-SUFFIX,rutracker.org," + RU,
    "DOMAIN-SUFFIX,rutracker.net," + RU,
    "DOMAIN-SUFFIX,t-ru.org," + RU,
    "DOMAIN-SUFFIX,nnmclub.to," + RU,
    "DOMAIN-SUFFIX,byrutor.com," + RU,
    "DOMAIN-SUFFIX,byrutor.org," + RU,
    "DOMAIN-SUFFIX,yandex.ru," + RU,
    "DOMAIN-SUFFIX,mail.ru," + RU,
    "DOMAIN-SUFFIX,vk.com," + RU,
    "DOMAIN-SUFFIX,ok.ru," + RU,
    "DOMAIN-SUFFIX,rutube.ru," + RU,
    "DOMAIN-SUFFIX,ru," + RU,
    "DOMAIN-SUFFIX,su," + RU,

    // OneDrive 必须在 Microsoft 直连规则之前。
    "DOMAIN-SUFFIX,onedrive.com," + ONEDRIVE,
    "DOMAIN-SUFFIX,onedrive.live.com," + ONEDRIVE,
    "DOMAIN-SUFFIX,storage.live.com," + ONEDRIVE,
    "DOMAIN-SUFFIX,1drv.com," + ONEDRIVE,
    "DOMAIN-SUFFIX,1drv.ms," + ONEDRIVE,
    "DOMAIN-KEYWORD,onedrive," + ONEDRIVE,

    // Apple 国区服务直连；humb.apple.com 已在前面单独分配给 ChatGPT。
    "DOMAIN-SUFFIX,apple.com,DIRECT",
    "DOMAIN-SUFFIX,apple.com.cn,DIRECT",
    "DOMAIN-SUFFIX,icloud.com,DIRECT",
    "DOMAIN-SUFFIX,icloud.com.cn,DIRECT",
    "DOMAIN-SUFFIX,icloud-content.com,DIRECT",
    "DOMAIN-SUFFIX,itunes.com,DIRECT",
    "DOMAIN-SUFFIX,mzstatic.com,DIRECT",
    "DOMAIN-SUFFIX,cdn-apple.com,DIRECT",
    "DOMAIN-SUFFIX,apple-cloudkit.com,DIRECT",
    "DOMAIN-SUFFIX,apple-dns.net,DIRECT",
    "DOMAIN-SUFFIX,aaplimg.com,DIRECT",

    // Steam
    "DOMAIN-SUFFIX,steampowered.com," + STEAM,
    "DOMAIN-SUFFIX,steamcommunity.com," + STEAM,
    "DOMAIN-SUFFIX,steamstatic.com," + STEAM,
    "DOMAIN-SUFFIX,steamcontent.com," + STEAM,
    "DOMAIN-SUFFIX,steamserver.net," + STEAM,
    "DOMAIN-SUFFIX,steamusercontent.com," + STEAM,
    "DOMAIN-KEYWORD,steam," + STEAM,

    // Microsoft 其他服务直连（OneDrive 已提前分流）。
    "DOMAIN-SUFFIX,microsoft.com,DIRECT",
    "DOMAIN-SUFFIX,microsoftonline.com,DIRECT",
    "DOMAIN-SUFFIX,microsoft.net,DIRECT",
    "DOMAIN-SUFFIX,microsoftstore.com,DIRECT",
    "DOMAIN-SUFFIX,live.com,DIRECT",
    "DOMAIN-SUFFIX,live.net,DIRECT",
    "DOMAIN-SUFFIX,office.com,DIRECT",
    "DOMAIN-SUFFIX,office.net,DIRECT",
    "DOMAIN-SUFFIX,office365.com,DIRECT",
    "DOMAIN-SUFFIX,sharepoint.com,DIRECT",
    "DOMAIN-SUFFIX,outlook.com,DIRECT",
    "DOMAIN-SUFFIX,hotmail.com,DIRECT",
    "DOMAIN-SUFFIX,msauth.net,DIRECT",
    "DOMAIN-SUFFIX,msauthimages.net,DIRECT",
    "DOMAIN-SUFFIX,msftauth.net,DIRECT",
    "DOMAIN-SUFFIX,msftauthimages.net,DIRECT",
    "DOMAIN-SUFFIX,windows.com,DIRECT",
    "DOMAIN-SUFFIX,windowsupdate.com,DIRECT",
    "DOMAIN-SUFFIX,msftconnecttest.com,DIRECT",
    "DOMAIN-SUFFIX,msftncsi.com,DIRECT",
    "DOMAIN-SUFFIX,visualstudio.com,DIRECT",
    "DOMAIN-SUFFIX,vsassets.io,DIRECT",
    "DOMAIN-SUFFIX,windows.net,DIRECT",
    "DOMAIN-SUFFIX,azureedge.net,DIRECT",
    "DOMAIN-SUFFIX,msedge.net,DIRECT",
    "DOMAIN-SUFFIX,xbox.com,DIRECT",
    "DOMAIN-SUFFIX,xboxlive.com,DIRECT",
    "DOMAIN-SUFFIX,skype.com,DIRECT",
    "DOMAIN-SUFFIX,bing.com,DIRECT",
    "DOMAIN-SUFFIX,msn.com,DIRECT",
    "DOMAIN-KEYWORD,microsoft,DIRECT",
    "DOMAIN-KEYWORD,office,DIRECT",
    "DOMAIN-KEYWORD,outlook,DIRECT",

    // 本地与内网地址直连。
    "DOMAIN-SUFFIX,local," + CN,
    "DOMAIN-SUFFIX,lan," + CN,
    "IP-CIDR,127.0.0.0/8," + CN + ",no-resolve",
    "IP-CIDR,10.0.0.0/8," + CN + ",no-resolve",
    "IP-CIDR,172.16.0.0/12," + CN + ",no-resolve",
    "IP-CIDR,192.168.0.0/16," + CN + ",no-resolve",

    // 已知国外域名优先走国际代理，避免被中国 CDN IP 误判为国内。
    "GEOSITE,geolocation-!cn," + INTL,
    // 国内域名和中国大陆 IP 兜底直连。
    "DOMAIN-SUFFIX,cn," + CN,
    "GEOSITE,cn," + CN,
    "GEOIP,CN," + CN,
    // 未命中的国际网站默认代理，绝不默认 DIRECT。
    "MATCH," + INTL
  ];

  return config;
}