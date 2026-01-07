const daysEl = document.getElementById("days");
const statusEl = document.getElementById("status");
const listEl = document.getElementById("list");

function renderSample(sample) {
  if (!sample || !sample.length) { listEl.hidden = true; listEl.innerHTML = ""; return; }
  listEl.hidden = false;
  listEl.innerHTML = sample.map(h =>
    `<div><code>${h.url}</code></div><hr>`
  ).join("");
}

async function scan() {
  statusEl.textContent = "Scanning…";
  listEl.hidden = true; listEl.innerHTML = "";
  const days = Number(daysEl.value || 0);
  const res = await chrome.runtime.sendMessage({ action: "scan", days });
  statusEl.textContent = `Matches: ${res.count}`;
  renderSample(res.sample || []);
}

document.getElementById("scan").addEventListener("click", scan);
