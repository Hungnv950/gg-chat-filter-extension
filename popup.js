const $ = (id) => document.getElementById(id);

chrome.storage.local.get({ enabled: true }, (v) => { $("enabled").checked = v.enabled; });

$("enabled").addEventListener("change", () => chrome.storage.local.set({ enabled: $("enabled").checked }));

$("reset").addEventListener("click", () => {
  chrome.storage.local.set({ known: [], selected: [], selectedGroups: [], sections: {}, sectionOrder: [], dmSection: null }, () => { $("reset").textContent = "Đã xoá"; });
});
