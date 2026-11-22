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
  proxy("🇯🇵 Japan Demo"),
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
assert.ok(!bilibili.proxies.includes("🇯🇵 Japan Demo"));
assert.ok(!bilibili.proxies.includes("🇺🇸 USA Alice"));

const rules = output.rules;
const indexOfRule = prefix => rules.findIndex(rule => rule.startsWith(prefix));
assert.ok(indexOfRule("DOMAIN-SUFFIX,github.com,") >= 0);
assert.ok(indexOfRule("DOMAIN-SUFFIX,githubusercontent.com,") >= 0);
assert.ok(indexOfRule("DOMAIN-SUFFIX,githubassets.com,") >= 0);
assert.ok(indexOfRule("DOMAIN-SUFFIX,bilibili.com,") >= 0);
assert.ok(indexOfRule("DOMAIN-SUFFIX,bilivideo.com,") >= 0);
assert.ok(indexOfRule("DOMAIN-SUFFIX,hdslb.com,") >= 0);
assert.ok(indexOfRule("DOMAIN-SUFFIX,bilibili.com,") < indexOfRule("GEOSITE,cn,"));
assert.ok(indexOfRule("DOMAIN-SUFFIX,bilibili.com,") < indexOfRule("GEOIP,CN,"));
assert.ok(rules[rules.length - 1].startsWith("MATCH,"));

assert.ok(group("🌐 Google"), "existing Google group must remain");
assert.ok(group("🌍 国际默认"), "existing international default group must remain");
assert.ok(group("♻️ 国际自动"), "existing international auto group must remain");
assert.equal(group("♻️ 国际自动").url, "https://www.gstatic.com/generate_204");
assert.equal(group("♻️ 国际自动").interval, 60);
assert.equal(group("♻️ 国际自动").lazy, true);
assert.equal(JSON.stringify(output.proxies), originalProxies, "original proxy nodes must remain unchanged");

console.log("PASS: GitHub auto routing, Bilibili manual HK/MO/TW routing, rule priority, and existing groups.");
