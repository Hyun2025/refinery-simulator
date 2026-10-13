/* Content-height book pages and bilingual document dialog. */
(() => {
  const dashboard = document.getElementById("dashboard");
  const groups = [
    { title: "현재 판단과 기준 전략", ids: ["decision", "benchmarks"] },
    { title: "구매 구성비 전체 탐색", ids: ["mixmap", "candidates"] },
    { title: "가격 경로와 시나리오", ids: ["prices", "comparison"] },
    { title: "생산과 제품 재고", ids: ["inventory", "throughput"] },
    { title: "손익 구성과 일별 분해", ids: ["finance", "breakdown"] },
    { title: "조건 변화와 LP 검증", ids: ["heatmap", "capacityChart", "lpcomparison"] },
  ];
  const book = document.createElement("div");
  book.className = "analysis-book";
  const top = document.createElement("nav");
  top.className = "book-nav";
  top.setAttribute("aria-label", "분석 페이지");
  top.innerHTML =
    '<button id="pagePrev" aria-label="이전 분석 페이지">← 이전</button><div><strong id="pageTitle"></strong><p id="pageCount" class="note" aria-live="polite"></p></div><button id="pageNext" aria-label="다음 분석 페이지">다음 →</button>';
  const chooser = document.createElement("div");
  chooser.className = "page-chooser";
  const content = document.createElement("div");
  content.className = "book-content";
  const bottom = document.createElement("nav");
  bottom.className = "book-nav";
  bottom.innerHTML =
    '<button id="pagePrevBottom">← 이전 페이지</button><button id="pageNextBottom">다음 페이지 →</button>';
  book.append(top, chooser, content, bottom);
  const panels = [];
  groups.forEach((g, i) => {
    const panel = document.createElement("div");
    panel.className = "book-page";
    panel.setAttribute("aria-label", g.title);
    g.ids.forEach((id) => {
      const section = document.getElementById(id).closest("section");
      panel.append(section);
    });
    panels.push(panel);
    content.append(panel);
    const b = document.createElement("button");
    b.textContent = `${i + 1}. ${g.title}`;
    b.onclick = () => show(i);
    chooser.append(b);
  });
  dashboard.append(book);
  render();
  let page = 0;
  function show(i) {
    page = Math.max(0, Math.min(groups.length - 1, i));
    panels.forEach((p, j) => {
      p.hidden = j !== page;
    });
    document.getElementById("pageTitle").textContent = groups[page].title;
    document.getElementById("pageCount").textContent =
      `${page + 1} / ${groups.length} · 페이지 높이는 내용에 맞게 조절됩니다.`;
    ["pagePrev", "pagePrevBottom"].forEach(
      (id) => (document.getElementById(id).disabled = page === 0),
    );
    ["pageNext", "pageNextBottom"].forEach(
      (id) => (document.getElementById(id).disabled = page === groups.length - 1),
    );
    [...chooser.children].forEach((b, j) =>
      b.setAttribute("aria-current", j === page ? "page" : "false"),
    );
  }
  ["pagePrev", "pagePrevBottom"].forEach(
    (id) => (document.getElementById(id).onclick = () => show(page - 1)),
  );
  ["pageNext", "pageNextBottom"].forEach(
    (id) => (document.getElementById(id).onclick = () => show(page + 1)),
  );
  show(0);
  // Natural height, rather than fixed plot/page height, preserves full tables and text.
  const toggle = document.getElementById("docsToggle"),
    dialog = document.getElementById("docsDialog");
  let index = 0;
  function drawDoc() {
    const lang = document.getElementById("docLanguage").value,
      doc = window.CF_DOCS[index];
    document.getElementById("docTitle").textContent =
      `${doc.title} · ${index + 1}/${window.CF_DOCS.length}`;
    document.getElementById("docBody").innerHTML = doc[lang].html;
    document.getElementById("docBody").lang = lang;
    document.getElementById("docPrev").disabled = index === 0;
    document.getElementById("docNext").disabled = index === window.CF_DOCS.length - 1;
    document.getElementById("docBody").scrollTop = 0;
  }
  toggle.onclick = () => {
    drawDoc();
    toggle.hidden = true;
    dialog.showModal();
    document.body.classList.add("reader-open");
  };
  document.getElementById("docClose").onclick = () => dialog.close();
  dialog.addEventListener("close", () => {
    toggle.hidden = false;
    document.body.classList.remove("reader-open");
    toggle.focus();
  });
  document.getElementById("docPrev").onclick = () => {
    index = Math.max(0, index - 1);
    drawDoc();
  };
  document.getElementById("docNext").onclick = () => {
    index = Math.min(window.CF_DOCS.length - 1, index + 1);
    drawDoc();
  };
  document.getElementById("docLanguage").onchange = drawDoc;
})();
