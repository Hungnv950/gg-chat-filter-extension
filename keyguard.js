// Chạy sớm (document_start) để đăng ký trước listener của Google Chat: phím gõ trong panel lọc
// không bị phím tắt / focus-trap của Chat nuốt mất. Chỉ chặn lan truyền, không chặn ký tự được gõ.
for (const ev of ["keydown", "keypress", "keyup"]) {
  window.addEventListener(ev, (e) => {
    const t = e.composedPath()[0];
    if (t && t.getRootNode && t.getRootNode().host && t.getRootNode().host.id === "gcsf-host") {
      e.stopImmediatePropagation();
    }
  }, true);
}
