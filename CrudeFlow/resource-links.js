/**
 * 원본 코드와 문서의 외부 안내를 추가할 때 이 파일만 수정하세요.
 * 빈 값이면 안내 영역을 숨깁니다. 예시 URL을 실제 주소로 바꿔 주세요.
 * 이 파일은 자동 다운로드를 실행하지 않습니다.
 */
const PROJECT_RESOURCES = {
  message: "", // 예: '전체 코드와 분석 문서는 아래 저장소에서 확인하실 수 있습니다.'
  codeUrl: "", // 예: 'https://github.com/사용자/프로젝트'
  documentsUrl: "", // 예: 문서를 공개한 웹페이지 또는 저장소 주소
};

(function renderProjectResources() {
  const section = document.getElementById("projectResources");
  const container = document.getElementById("resourceLinks");
  document.getElementById("resourceMessage").textContent = PROJECT_RESOURCES.message;
  const resources = [
    ["원본 코드 보기", PROJECT_RESOURCES.codeUrl],
    ["분석 문서 보기", PROJECT_RESOURCES.documentsUrl],
  ];
  for (const [title, address] of resources) {
    if (!address) continue;
    try {
      const url = new URL(address);
      if (!["https:", "http:"].includes(url.protocol)) continue;
      const link = document.createElement("a");
      link.textContent = title;
      link.href = url.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.style.marginRight = "18px";
      container.append(link);
    } catch {
      // 잘못된 주소는 표시하지 않습니다.
    }
  }
  section.hidden = !PROJECT_RESOURCES.message && container.children.length === 0;
})();
