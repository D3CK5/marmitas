import { r as reactDomExports, j as jsxRuntimeExports, B as BrowserRouter, R as Routes, a as Route, b as React } from "./vendor-PWRoOJjM.js";
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
var client = {};
var m = reactDomExports;
{
  client.createRoot = m.createRoot;
  client.hydrateRoot = m.hydrateRoot;
}
function App() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(BrowserRouter, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "app-container", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "app-header", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: "Marmitas" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "app-content", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Routes, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/", element: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "Home Page" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "*", element: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "Not Found" }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "app-footer", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
      "© ",
      (/* @__PURE__ */ new Date()).getFullYear(),
      " Marmitas. All rights reserved."
    ] }) })
  ] }) });
}
client.createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(App, {}) })
);
//# sourceMappingURL=index-BIhHdBjY.js.map
