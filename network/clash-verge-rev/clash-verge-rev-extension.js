// Clash Verge Rev 扩展脚本
// 版本：2026-11-13.2 GPT 专用探测与持续测速修订版
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
  const gptManual = pickOrdered(["US", "JP", "SG", "KR", "GB", "TW"]);
  // GPT 自动优先美国，其次日本、新加坡、韩国、英国；台湾保留手动，不自动选。
  const gptAuto = pickAutoOrdered(["JP", "US", "SG", "TW", "KR", "GB"]);

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
        "max-failed-times": 2
      };

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

  // 自动组统一使用 URLTest：按各业务检测地址的响应延迟择优。
  // 180 秒检测一次，40ms 切换容差，减少慢节点长期占用与小幅抖动造成的频繁切换。
  // ChatGPT 使用公开认证提供商入口作为探测目标，避免只测首页静态壳。
  // lazy:false 使 GPT 自动组即使暂时未被选中，也持续更新节点健康状态。
  // 注意：HTTP 探测不能验证已登录会话、Cloudflare 人机验证或对话 WebSocket。
  addService(
    "💬 ChatGPT", "♻️ GPT自动", "url-test", gptAuto, gptManual,
    {
      url: "https://chatgpt.com/api/auth/providers",
      expectedStatus: "200",
      interval: 90,
      timeout: 5000,
      tolerance: 30,
      lazy: false
    }
  );

  addService(
    "🌐 Google", "♻️ Google自动", "url-test", googleAuto, googleManual,
    { url: "https://www.google.com/generate_204", expectedStatus: "204", interval: 180, timeout: 8000, tolerance: 40 }
  );

  addService(
    "📱 TikTok", "♻️ TikTok自动", "url-test", tiktokAuto, tiktokManual,
    { url: "https://www.tiktok.com/", expectedStatus: "200/301/302", interval: 180, timeout: 8000, tolerance: 40 }
  );

  addService(
    "🪆 俄站", "♻️ 俄站自动", "url-test", russianAuto, russianManual,
    { url: "https://yandex.ru/", expectedStatus: "200/301/302", interval: 180, timeout: 8000, tolerance: 40 }
  );

  addService(
    "☁️ OneDrive", "♻️ OneDrive自动", "url-test", onedriveAuto, onedriveManual,
    { url: "https://onedrive.live.com/", expectedStatus: "200/301/302", interval: 180, timeout: 8000, tolerance: 40 }
  );

  addService(
    "🎮 Steam", "♻️ Steam自动", "url-test", steamAuto, steamManual,
    { url: "https://store.steampowered.com/", expectedStatus: "200/301/302", interval: 180, timeout: 8000, tolerance: 40 }
  );

  groups.push({
    name: "🇨🇳 国内直连",
    type: "select",
    proxies: ["DIRECT"],
    "default-selected": "DIRECT"
  });

  addService(
    "🌍 国际默认", "♻️ 国际自动", "url-test", intlAuto, intlManual,
    { url: "https://www.gstatic.com/generate_204", expectedStatus: "204", interval: 180, timeout: 8000, tolerance: 40 }
  );

  // 完全重建策略组，避免机场模板组（Emby、iQiyi、Disney 等）重新出现。
  config["proxy-groups"] = groups;

  const GPT = "💬 ChatGPT";
  const GOOGLE = "🌐 Google";
  const TIKTOK = "📱 TikTok";
  const RU = "🪆 俄站";
  const ONEDRIVE = "☁️ OneDrive";
  const STEAM = "🎮 Steam";
  const CN = "🇨🇳 国内直连";
  const INTL = "🌍 国际默认";

  config.rules = [
    // ChatGPT / OpenAI：主站、认证、Cloudflare 验证、WorkOS 等尽量固定同一出口。
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