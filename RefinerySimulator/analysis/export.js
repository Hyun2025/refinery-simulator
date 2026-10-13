const fs = require("fs"),
  CF = require("../engine");
const cases = [
  { name: "기준", options: {} },
  { name: "할인 확대", options: { discount: 12 } },
  { name: "X 입고 지연", options: { delay: 15 } },
  { name: "낮은 부하 예산", options: { budget: 15000 } },
  { name: "Wave 가격", options: { scenario: "wave" } },
];
const out = cases.map((v) => ({
  name: v.name,
  options: { ...CF.defaults, ...v.options },
  results: CF.evaluate(v.options).all,
}));
fs.writeFileSync(__dirname + "/scenarios.json", JSON.stringify(out));
