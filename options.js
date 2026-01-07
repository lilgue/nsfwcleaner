const kwEl = document.getElementById("kw");
const msgEl = document.getElementById("msg");

async function load() {
  const res = await chrome.runtime.sendMessage({ action: "getKeywords" });
  kwEl.value = (res.keywords || []).join("\n");
}
async function save() {
  const list = kwEl.value.split("\n").map(s => s.trim()).filter(Boolean);
  await chrome.runtime.sendMessage({ action: "setKeywords", keywords: list });
  msgEl.textContent = "Saved";
  setTimeout(() => msgEl.textContent = "", 1200);
}
document.getElementById("save").addEventListener("click", save);
load();
