/* Plain-language control help; hover, keyboard focus, touch and Escape. */
(function () {
  "use strict";
  const descriptions = {
    gasolineContract:
      "휘발유를 하루에 반드시 공급해야 하는 양입니다. 기본값은 5,000배럴이며 0~120,000 사이 정수로 바꿀 수 있습니다. 다음 날 예약 재고와 60일 계약 총량도 함께 바뀝니다. 저장된 LP 실험은 자동 갱신되지 않습니다.",
    dieselContract:
      "경유를 하루에 반드시 공급해야 하는 양입니다. 기본값은 5,000배럴입니다. 값을 늘리면 계약을 지키는 구매 조합이 줄어들 수 있습니다. 추가 판매 한도는 이 입력과 별개입니다.",
    scenario: "",
    amplitude:
      "추가 판매 가격이 기준가격에서 얼마나 오르내리는지 정합니다. 예를 들어 20%는 곡선이 가장 크게 변하는 곳의 변화폭입니다. 고정 가격과 직접 조정 경로에서는 이 슬라이더가 가격을 바꾸지 않습니다.",
    discount:
      "X 원유의 기본 가격 75달러에서 추가로 깎는 금액입니다. 5달러로 설정하면 구매가격은 배럴당 70달러입니다. 운송비와 처리비는 별도로 계산합니다.",
    delay:
      "X 원유가 기준 입고일인 7일차보다 며칠 늦게 도착하는지 정합니다. 3일이면 10일차부터 하역할 수 있습니다. Y와 Z의 도착일은 바뀌지 않습니다.",
    initialDays:
      "구매한 100만 배럴과 별도로, 시작할 때 창고에 있는 Y 원유의 양입니다. 1일은 2만 배럴이며 10일은 20만 배럴입니다. 실제로 그 일수만큼 가동할 수 있다는 보장은 아닙니다.",
    budget:
      "공장이 하루에 감당할 수 있는 작업부하량입니다. X는 1배럴당 1.4점, Y는 1점, Z는 0.9점을 씁니다. 한도가 2만 점이면 X만 처리할 때 약 14,286배럴을 처리할 수 있습니다. 원유 처리량은 별도로 하루 2만 배럴을 넘을 수 없습니다.",
    contours:
      "계산한 구매 조합 점 사이의 이익을 추정해, 비슷한 이익을 내는 곳을 선으로 연결합니다. 선 위의 모든 비율을 직접 계산한 것은 아닙니다. 계약을 지킬 수 있는 세 점으로 둘러싸인 영역에만 선을 그립니다. 정확한 판단은 계산된 점을 클릭해 확인하세요.",
    heatmode:
      "지도 색으로 무엇을 보여줄지 고릅니다. X 비율은 추천 조합에서 X를 얼마나 사는지, 최고 성과는 계약을 지킨 조합 중 가장 높은 이익을 뜻합니다.",
    breakmode:
      "일별은 그날 발생한 금액이고, 누적은 시작일부터 해당 날짜까지 더한 금액입니다. 검은 선은 현재 선택해 표시한 항목만 더한 값입니다.",
    fullFinance:
      "일상적인 생산·판매 내역에 더해 구매대금과 시작·마지막 재고 평가를 표시합니다. 재고 평가는 아직 팔지 않은 자산의 값을 계산한 것이므로 실제 현금 입출금과 다릅니다.",
  };
  descriptions.scenario =
    "가격이 일정하거나 오르내리는 상황을 선택합니다. 이 경로는 추가 판매 가격에만 적용됩니다. 원유 구매가격과 매일의 계약 판매가격은 바뀌지 않습니다. 직접 조정은 그래프의 두 점을 움직여 가격 경로를 만드는 방식입니다.";

  const tip = document.createElement("div");
  tip.id = "controlHelp";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  document.body.append(tip);
  let active = null,
    timer;
  function hide() {
    clearTimeout(timer);
    tip.hidden = true;
    active = null;
  }
  function show(button, message) {
    clearTimeout(timer);
    active = button;
    tip.textContent = message;
    tip.hidden = false;
    const rect = button.getBoundingClientRect();
    const width = tip.offsetWidth,
      height = tip.offsetHeight;
    tip.style.left = Math.max(12, Math.min(rect.left - width + 22, innerWidth - width - 12)) + "px";
    const top =
      rect.bottom + 8 + height <= innerHeight - 12 ? rect.bottom + 8 : rect.top - height - 8;
    tip.style.top = Math.max(12, top) + "px";
  }
  function leave(button) {
    timer = setTimeout(() => {
      if (!tip.matches(":hover")) hide();
    }, 100);
  }
  for (const [id, message] of Object.entries(descriptions)) {
    const control = document.getElementById(id);
    if (!control) continue;
    const label = control.closest("label");
    const mark = document.createElement("button");
    mark.type = "button";
    mark.className = "help-mark";
    mark.textContent = "!";
    mark.setAttribute("aria-label", "이 설정의 설명 보기");
    mark.setAttribute("aria-describedby", tip.id);
    // Put the icon beside the existing title. No duplicated help heading.
    const titleNode = [...label.childNodes].find(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
    );
    if (titleNode) {
      const title = document.createElement("span");
      title.className = "control-title";
      title.textContent = titleNode.textContent;
      titleNode.replaceWith(title);
      title.append(mark);
    } else {
      label.prepend(mark);
    }
    mark.addEventListener("pointerenter", () => show(mark, message));
    mark.addEventListener("pointerleave", () => leave(mark));
    mark.addEventListener("focus", () => show(mark, message));
    mark.addEventListener("blur", () => leave(mark));
    mark.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      show(mark, message);
    });
  }
  tip.addEventListener("pointerenter", () => clearTimeout(timer));
  tip.addEventListener("pointerleave", () => {
    if (active && document.activeElement !== active) hide();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hide();
  });
  document.addEventListener("pointerdown", (event) => {
    if (active && event.target !== active && !tip.contains(event.target)) hide();
  });
  window.addEventListener("resize", hide);
  document.addEventListener("scroll", hide, true);
})();
