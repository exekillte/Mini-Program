const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const scriptPath = path.join(__dirname, "..", "clash-verge-rev-extension.js");
const source = fs.readFileSync(scriptPath, "utf8");
const sandbox = {};
vm.runInNewContext(source, sandbox, { filename: scriptPath });

assert.equal(typeof sandbox.main, "function", "main(config) must be defined");

const proxy = name => ({ name, type: "vmess", server: "node.example", port: 443 });
const proxies = [
  proxy("🇺🇸 USA Alice"),
  proxy("🇭🇰 Hong Kong Demo"),
  proxy("🇲🇴 Macau Demo"),
  proxy("🇹🇼 Taiwan Demo"),
  proxy("🇯🇵 Japan Demo A"),
  proxy("🇯🇵 Japan Demo B"),
  proxy("🇸🇬 Singapore Demo"),
  proxy("🇩🇪 Germany Demo"),
  proxy("congyu.org 🐱"),
  proxy("🇭🇰 请更新订阅")
];
const config = { proxies, "proxy-groups": [], rules: [], dns: { enable: true } };
const originalProxies = JSON.stringify(config.proxies);
const output = sandbox.main(config, "smoke-test");
const groups = output["proxy-groups"];
const group = name => groups.find(item => item.name === name);
const github = group("🐙 GitHub");
const githubAuto = group("♻️ GitHub自动");
const bilibili = group("📺 哔哩哔哩");
const adult = group("🔞 成人网站");
const adultJapan = group("♻️ 成人日本自动");
const adultManual = group("🖐 成人手动");

assert.ok(github, "GitHub parent selector must exist");
assert.equal(github.type, "select");
assert.equal(github["default-selected"], "♻️ GitHub自动");
assert.ok(github.proxies.includes("♻️ GitHub自动"));
assert.ok(githubAuto, "GitHub URLTest group must exist");
assert.equal(githubAuto.type, "url-test");
assert.equal(githubAuto.url, "https://github.com/");
assert.equal(String(githubAuto["expected-status"]), "200");
assert.equal(githubAuto.interval, 60);
assert.equal(githubAuto.timeout, 5000);
assert.equal(githubAuto.tolerance, 100);
assert.equal(githubAuto["max-failed-times"], 1);
assert.equal(githubAuto.lazy, true);
assert.ok(githubAuto.proxies.includes("🇺🇸 USA Alice"));
assert.ok(githubAuto.proxies.includes("🇭🇰 Hong Kong Demo"));
assert.ok(githubAuto.proxies.includes("🇲🇴 Macau Demo"));
assert.ok(githubAuto.proxies.includes("🇹🇼 Taiwan Demo"));
assert.ok(!githubAuto.proxies.includes("congyu.org 🐱"), "unclassified bare-domain node must not enter auto pool");
assert.ok(!githubAuto.proxies.includes("🇭🇰 请更新订阅"), "subscription notice must not enter auto pool");

assert.ok(bilibili, "Bilibili selector must exist");
assert.equal(bilibili.type, "select");
assert.equal(bilibili["default-selected"], "DIRECT");
assert.ok(bilibili.proxies.includes("DIRECT"));
assert.ok(bilibili.proxies.includes("🇭🇰 Hong Kong Demo"));
assert.ok(bilibili.proxies.includes("🇲🇴 Macau Demo"));
assert.ok(bilibili.proxies.includes("🇹🇼 Taiwan Demo"));
assert.ok(!bilibili.proxies.includes("🇯🇵 Japan Demo A"));
assert.ok(!bilibili.proxies.includes("🇺🇸 USA Alice"));

assert.ok(adult, "Adult website selector must exist");
assert.equal(adult.type, "select");
assert.equal(adult["default-selected"], "♻️ 成人日本自动", "default country should have the largest recognized node pool");
assert.ok(adult.proxies.includes("♻️ 成人日本自动"));
assert.ok(adult.proxies.includes("♻️ 成人香港自动"));
assert.ok(adult.proxies.includes("♻️ 成人台湾自动"));
assert.ok(adult.proxies.includes("♻️ 成人新加坡自动"));
assert.ok(adult.proxies.includes("♻️ 成人美国自动"));
assert.ok(adult.proxies.includes("🖐 成人手动"));

assert.ok(adultJapan, "Japan-specific adult URLTest group must exist");
assert.equal(adultJapan.type, "url-test");
assert.equal(adultJapan.url, "https://cp.cloudflare.com/generate_204");
assert.equal(String(adultJapan["expected-status"]), "204");
assert.equal(adultJapan.interval, 60);
assert.equal(adultJapan.timeout, 5000);
assert.equal(adultJapan.tolerance, 150);
assert.equal(adultJapan["max-failed-times"], 1);
assert.equal(adultJapan.lazy, false, "all country pools must keep probing while unselected");
assert.deepEqual(Array.from(adultJapan.proxies), ["🇯🇵 Japan Demo A", "🇯🇵 Japan Demo B"]);
assert.ok(adultManual, "Adult manual pool must exist");
assert.ok(adultManual.proxies.includes("congyu.org 🐱"), "unclassified overseas nodes remain manually selectable");
assert.ok(!groups.some(item => item.name.startsWith("♻️ 成人") && item.type === "fallback"),
  "adult routing must avoid nested fallback groups; cross-country changes stay manual");

const adultCountryGroups = groups.filter(item => item.name.startsWith("♻️ 成人") && item.type === "url-test");
assert.ok(adultCountryGroups.length >= 5);
for (const item of adultCountryGroups) {
  assert.equal(item.url, "https://cp.cloudflare.com/generate_204");
  assert.equal(item.interval, 60);
  assert.equal(item.timeout, 5000);
  assert.equal(item.lazy, false);
  assert.equal(item.tolerance, 150);
}

const rules = output.rules;
const indexOfRule = prefix => rules.findIndex(rule => rule.startsWith(prefix));
for (const host of [
  "github-production-release-asset-2e65be.s3.amazonaws.com",
  "github-production-repository-file-5c1aeb.s3.amazonaws.com",
  "github-production-user-asset-6210df.s3.amazonaws.com"
]) {
  assert.ok(rules.includes("DOMAIN," + host + ",🐙 GitHub"), "missing GitHub S3 route: " + host);
}
for (const domain of [
  "rule34.xxx", "phncdn.com", "phprcdn.com", "xhcdn.com",
  "xvideos-cdn.com", "ypncdn.com", "mfcimg.com",
  "chaturbate.com", "asmr.one", "dlsite.com"
]) {
  assert.ok(rules.includes("DOMAIN-SUFFIX," + domain + ",🔞 成人网站"), "missing adult route: " + domain);
}
assert.ok(indexOfRule("DOMAIN-SUFFIX,github.com,") >= 0);
assert.ok(indexOfRule("DOMAIN-SUFFIX,githubusercontent.com,") >= 0);
assert.ok(indexOfRule("DOMAIN-SUFFIX,githubassets.com,") >= 0);
assert.ok(indexOfRule("DOMAIN-SUFFIX,bilibili.com,") >= 0);
assert.ok(indexOfRule("DOMAIN-SUFFIX,bilivideo.com,") >= 0);
assert.ok(indexOfRule("DOMAIN-SUFFIX,hdslb.com,") >= 0);
assert.ok(indexOfRule("DOMAIN-SUFFIX,bilibili.com,") < indexOfRule("GEOSITE,cn,"));
assert.ok(indexOfRule("DOMAIN-SUFFIX,bilibili.com,") < indexOfRule("GEOIP,CN,"));
assert.ok(indexOfRule("DOMAIN-SUFFIX,rule34.xxx,") < indexOfRule("GEOSITE,cn,"));
assert.ok(indexOfRule("DOMAIN-SUFFIX,rule34.xxx,") < indexOfRule("GEOIP,CN,"));
assert.ok(indexOfRule("DOMAIN-SUFFIX,rule34.xxx,") < indexOfRule("GEOSITE,geolocation-!cn,"));
assert.ok(rules[rules.length - 1].startsWith("MATCH,"));

assert.ok(group("🌐 Google"), "existing Google group must remain");
assert.ok(group("🌍 国际默认"), "existing international default group must remain");
assert.ok(group("♻️ 国际自动"), "existing international auto group must remain");
assert.equal(group("♻️ 国际自动").url, "https://www.gstatic.com/generate_204");
assert.equal(group("♻️ 国际自动").interval, 60);
assert.equal(group("♻️ 国际自动").lazy, true);
assert.equal(groups.filter(item => ["💬 ChatGPT","🐙 GitHub","🌐 Google","📱 TikTok","🪆 俄站","☁️ OneDrive","🎮 Steam","🇨🇳 国内直连","📺 哔哩哔哩","🔞 成人网站","🌍 国际默认"].includes(item.name)).length, 11);
assert.equal(JSON.stringify(output.proxies), originalProxies, "original proxy nodes must remain unchanged");

console.log("PASS: GitHub S3 routes, Bilibili manual HK/MO/TW routing, adult country-sticky pools, adult domains, rule priority, and existing groups.");
