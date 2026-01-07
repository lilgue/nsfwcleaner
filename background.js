const DEFAULT_KEYWORDS = [
  "porn","xxx","sex","nsfw","nude","naked","hentai","rule34","milf","teen",
  "boobs","tits","nipples","ass","anal","deepthroat","blowjob","handjob",
  "cum","facial","creampie","threesome","gangbang","bdsm","fetish","futanari",
  "incest","stepmom","stepdad","stepsis","daddy","mommy","shemale","tranny",
  "gay porn","lesbian porn","yaoi","yuri","cam girl","onlyfans","ero","stripchat", "squirt", "piss","cam", "pimp", "turbate", "nsfw", "goth", "redgif", "reddit", "recu", "spank", "thot", "leak", "queef", "xvideos", "yandex", "fart", "fap", "link", "uncensored", "beacons","getmysocial","dildo", "fans", "bunkr"
];

function normUrl(u) {
  if (!u) return "";
  let s = u.toLowerCase().trim().replace(/\+/g, " ");
  for (let i = 0; i < 2; i++) {
    try { s = decodeURIComponent(s); } catch { break; }
  }
  return s;
}

async function getKeywords() {
  return new Promise(res => {
    chrome.storage.sync.get({ nsfwKeywords: DEFAULT_KEYWORDS }, o => {
      const list = (o.nsfwKeywords || []).map(x => String(x).toLowerCase().trim()).filter(Boolean);
      res(list);
    });
  });
}

function makeMatcher(keywords) {
  if (!keywords.length) return () => false;
  const keys = new Set();
  for (const k0 of keywords) {
    const k = k0.toLowerCase();
    keys.add(k);
    if (k.includes(" ")) {
      keys.add(k.replace(/\s+/g, "-"));
      keys.add(k.replace(/\s+/g, "_"));
      keys.add(k.replace(/\s+/g, "%20"));
    }
  }
  const arr = Array.from(keys);
  return (url) => {
    const s = normUrl(url);
    for (const k of arr) if (k && s.includes(k)) return true;
    return false;
  };
}

async function scanHistory(days) {
  const startTime = days && days > 0 ? Date.now() - days * 86400000 : 0;
  const keywords = await getKeywords();
  const match = makeMatcher(keywords);
  const items = await chrome.history.search({ text: "", startTime, maxResults: 100000 });
  const hits = [];
  for (const item of items) if (match(item.url)) hits.push({ url: item.url, title: item.title || "" });
  return hits;
}

async function deleteUrls(urls) {
  for (const url of urls) {
    try { await chrome.history.deleteUrl({ url }); } catch {}
  }
}

async function closeMatchingTabs() {
  const [keywords, tabs] = await Promise.all([getKeywords(), chrome.tabs.query({})]);
  const match = makeMatcher(keywords);
  const toClose = [];
  for (const t of tabs) if (t.url && match(t.url)) toClose.push(t.id);
  if (toClose.length) await chrome.tabs.remove(toClose);
  return toClose.length;
}

// Popup messaging: scan only
chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  (async () => {
    if (req.action === "scan") {
      const hits = await scanHistory(req.days);
      sendResponse({ count: hits.length, sample: hits.slice(0, 50) });
    } else if (req.action === "getKeywords") {
      const k = await getKeywords();
      sendResponse({ keywords: k });
    } else if (req.action === "setKeywords") {
      const list = Array.isArray(req.keywords) ? req.keywords : DEFAULT_KEYWORDS;
      chrome.storage.sync.set({ nsfwKeywords: list }, () => sendResponse({ ok: true }));
    } else {
      sendResponse({ error: "unknown_action" });
    }
  })();
  return true;
});

// Keyboard shortcut: purge history + close tabs (all time)
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "purge_nsfw") return;
  try {
    const hits = await scanHistory(0); // all time
    await deleteUrls(hits.map(h => h.url));
    await closeMatchingTabs();
  } catch {}
});
