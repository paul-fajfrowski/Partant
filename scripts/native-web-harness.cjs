const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const {
  JSDOM,
  VirtualConsole,
} = require("../work/qa-runtime/node_modules/jsdom");
const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(
  path.join(root, "apps/mobile/dist/index.html"),
  "utf8",
);
const scripts = [
  ...html.matchAll(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g),
].map((m) =>
  fs.readFileSync(path.join(root, "apps/mobile/dist", m[1]), "utf8"),
);
const errors = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => {
  if (!e.message.includes("Not implemented")) errors.push(e.message);
});
vc.on("error", (...a) => errors.push(a.join(" ")));
const dom = new JSDOM(
  html.replace(/<script[^>]*src="[^"]+"[^>]*><\/script>/g, ""),
  {
    url: "http://127.0.0.1:8081/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      Object.defineProperty(w, "innerWidth", { value: 390 });
      Object.defineProperty(w, "innerHeight", { value: 844 });

      w.matchMedia = (q) => ({
        matches: false,
        media: q,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
      });
      w.TextEncoder = TextEncoder;
      w.TextDecoder = TextDecoder;
      w.fetch = fetch;
      w.Headers = Headers;
      w.Request = Request;
      w.Response = Response;
      w.AbortController = AbortController;
      w.FontFace = class {
        constructor(name) {
          this.family = name;
          this.status = "loaded";
        }
        load() {
          return Promise.resolve(this);
        }
      };
      Object.defineProperty(w.document, "fonts", {
        value: {
          ready: Promise.resolve(),
          check: () => true,
          add() {},
          load: () => Promise.resolve([{}]),
        },
      });
      w.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
      w.HTMLElement.prototype.scrollTo = function () {};
      w.HTMLElement.prototype.scrollIntoView = function () {};
    },
  },
);
const w = dom.window,
  d = w.document;
Object.defineProperty(w.document.documentElement, "clientWidth", {
  get: () => 390,
});
Object.defineProperty(w.document.documentElement, "clientHeight", {
  get: () => 844,
});
for (const script of scripts) w.eval(script);
const wait = () => new Promise((r) => setTimeout(r, 150));
let count = 0;
function ok(value, msg) {
  assert.ok(value, msg);
  count++;
}
function button(text) {
  const el = [
    ...d.querySelectorAll('[role="button"],button,[role="tab"],[role="radio"]'),
  ].find(
    (el) =>
      el.textContent.trim() === text || el.getAttribute("aria-label") === text,
  );
  assert.ok(el, `Missing button ${text}\n${d.body.textContent.slice(-1000)}`);
  return el;
}
async function click(text) {
  button(text).click();
  await wait();
}
function input(label, value) {
  const el = d.querySelector(
    `input[aria-label="${label}"],textarea[aria-label="${label}"]`,
  );
  assert.ok(el, `Missing input ${label}`);
  Object.getOwnPropertyDescriptor(
    el.tagName === "TEXTAREA"
      ? w.HTMLTextAreaElement.prototype
      : w.HTMLInputElement.prototype,
    "value",
  ).set.call(el, value);
  el.dispatchEvent(new w.Event("input", { bubbles: true }));
}

module.exports = {
  w,
  d,
  wait,
  click,
  input,
  ok,
  errors,
  finish(label = "native settings") {
    ok(errors.length === 0, "No runtime errors: " + errors.join(";"));
    console.log(`PASS ${count} ${label} DOM checks. Not a visual validation.`);
    dom.window.close();
  },
  close() {
    dom.window.close();
  },
};
