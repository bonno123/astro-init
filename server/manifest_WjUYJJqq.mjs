import '@astrojs/internal-helpers/path';
import 'cookie';
import { bold, red, yellow, dim, blue } from 'kleur/colors';
import './chunks/astro_CCI5kFjB.mjs';
import 'clsx';
import { compile } from 'path-to-regexp';

const dateTimeFormat = new Intl.DateTimeFormat([], {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});
const levels = {
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  silent: 90
};
function log(opts, level, label, message, newLine = true) {
  const logLevel = opts.level;
  const dest = opts.dest;
  const event = {
    label,
    level,
    message,
    newLine
  };
  if (!isLogLevelEnabled(logLevel, level)) {
    return;
  }
  dest.write(event);
}
function isLogLevelEnabled(configuredLogLevel, level) {
  return levels[configuredLogLevel] <= levels[level];
}
function info(opts, label, message, newLine = true) {
  return log(opts, "info", label, message, newLine);
}
function warn(opts, label, message, newLine = true) {
  return log(opts, "warn", label, message, newLine);
}
function error(opts, label, message, newLine = true) {
  return log(opts, "error", label, message, newLine);
}
function debug(...args) {
  if ("_astroGlobalDebug" in globalThis) {
    globalThis._astroGlobalDebug(...args);
  }
}
function getEventPrefix({ level, label }) {
  const timestamp = `${dateTimeFormat.format(/* @__PURE__ */ new Date())}`;
  const prefix = [];
  if (level === "error" || level === "warn") {
    prefix.push(bold(timestamp));
    prefix.push(`[${level.toUpperCase()}]`);
  } else {
    prefix.push(timestamp);
  }
  if (label) {
    prefix.push(`[${label}]`);
  }
  if (level === "error") {
    return red(prefix.join(" "));
  }
  if (level === "warn") {
    return yellow(prefix.join(" "));
  }
  if (prefix.length === 1) {
    return dim(prefix[0]);
  }
  return dim(prefix[0]) + " " + blue(prefix.splice(1).join(" "));
}
if (typeof process !== "undefined") {
  let proc = process;
  if ("argv" in proc && Array.isArray(proc.argv)) {
    if (proc.argv.includes("--verbose")) ; else if (proc.argv.includes("--silent")) ; else ;
  }
}
class Logger {
  options;
  constructor(options) {
    this.options = options;
  }
  info(label, message, newLine = true) {
    info(this.options, label, message, newLine);
  }
  warn(label, message, newLine = true) {
    warn(this.options, label, message, newLine);
  }
  error(label, message, newLine = true) {
    error(this.options, label, message, newLine);
  }
  debug(label, ...messages) {
    debug(label, ...messages);
  }
  level() {
    return this.options.level;
  }
  forkIntegrationLogger(label) {
    return new AstroIntegrationLogger(this.options, label);
  }
}
class AstroIntegrationLogger {
  options;
  label;
  constructor(logging, label) {
    this.options = logging;
    this.label = label;
  }
  /**
   * Creates a new logger instance with a new label, but the same log options.
   */
  fork(label) {
    return new AstroIntegrationLogger(this.options, label);
  }
  info(message) {
    info(this.options, this.label, message);
  }
  warn(message) {
    warn(this.options, this.label, message);
  }
  error(message) {
    error(this.options, this.label, message);
  }
  debug(message) {
    debug(this.label, message);
  }
}

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getRouteGenerator(segments, addTrailingSlash) {
  const template = segments.map((segment) => {
    return "/" + segment.map((part) => {
      if (part.spread) {
        return `:${part.content.slice(3)}(.*)?`;
      } else if (part.dynamic) {
        return `:${part.content}`;
      } else {
        return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
    }).join("");
  }).join("");
  let trailing = "";
  if (addTrailingSlash === "always" && segments.length) {
    trailing = "/";
  }
  const toPath = compile(template + trailing);
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    const path = toPath(sanitizedParams);
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware(_, next) {
      return next();
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes
  };
}

const manifest = deserializeManifest({"adapterName":"@astrojs/node","routes":[{"file":"404.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/404","isIndex":false,"type":"page","pattern":"^\\/404\\/$","segments":[[{"content":"404","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/404.astro","pathname":"/404","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"always"}}},{"file":"about/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/about","isIndex":false,"type":"page","pattern":"^\\/about\\/$","segments":[[{"content":"about","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/about.astro","pathname":"/about","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"always"}}},{"file":"playground/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/playground","isIndex":false,"type":"page","pattern":"^\\/playground\\/$","segments":[[{"content":"playground","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/playground.astro","pathname":"/playground","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"always"}}},{"file":"resume/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/resume","isIndex":false,"type":"page","pattern":"^\\/resume\\/$","segments":[[{"content":"resume","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/resume.astro","pathname":"/resume","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"always"}}},{"file":"worker/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/worker","isIndex":false,"type":"page","pattern":"^\\/worker\\/$","segments":[[{"content":"worker","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/worker.astro","pathname":"/worker","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"always"}}},{"file":"index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"always"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/node.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"always"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/comments/[id]","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/comments\\/([^/]+?)\\/$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"comments","dynamic":false,"spread":false}],[{"content":"id","dynamic":true,"spread":false}]],"params":["id"],"component":"src/pages/api/comments/[id].ts","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"always"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/comments","isIndex":true,"type":"endpoint","pattern":"^\\/api\\/comments\\/$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"comments","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/comments/index.ts","pathname":"/api/comments","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"always"}}},{"file":"","links":[],"scripts":[{"type":"inline","value":"const c=document.querySelectorAll(\"[data-id]\");c.forEach(e=>{e.addEventListener(\"click\",async n=>{const t=e.dataset.id,a=await(await fetch(`/api/comments/${t}/`,{method:\"DELETE\"})).json();console.log({json:a})})});const o=document.getElementById(\"add-comment\");o.addEventListener(\"submit\",async e=>{e.preventDefault();const n=new FormData(o),t=Object.fromEntries(n);await(await fetch(\"/api/comments/\",{method:\"POST\",body:JSON.stringify(t),headers:{\"Content-Type\":\"application/json\"}})).json()});\n"}],"styles":[{"type":"inline","content":".even-columns[data-astro-cid-aui7cjyt]{display:grid;gap:1rem}@media (min-width: 50em){.even-columns[data-astro-cid-aui7cjyt]{grid-auto-flow:column;grid-auto-columns:1fr}}\n"},{"type":"external","src":"/_astro/about.BkNwpbDv.css"}],"routeData":{"route":"/dev","isIndex":false,"type":"page","pattern":"^\\/dev\\/$","segments":[[{"content":"dev","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/dev.astro","pathname":"/dev","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"always"}}}],"site":"https://avikbanik.com","base":"/","trailingSlash":"always","compressHTML":true,"componentMetadata":[["/home/avik/dev/absent-antimatter/src/pages/404.astro",{"propagation":"none","containsHead":true}],["/home/avik/dev/absent-antimatter/src/pages/about.astro",{"propagation":"none","containsHead":true}],["/home/avik/dev/absent-antimatter/src/pages/dev.astro",{"propagation":"none","containsHead":true}],["/home/avik/dev/absent-antimatter/src/pages/index.astro",{"propagation":"in-tree","containsHead":true}],["/home/avik/dev/absent-antimatter/src/pages/playground.astro",{"propagation":"none","containsHead":true}],["/home/avik/dev/absent-antimatter/src/pages/resume.astro",{"propagation":"none","containsHead":true}],["\u0000@astro-page:src/pages/index@_@astro",{"propagation":"in-tree","containsHead":false}],["\u0000@astrojs-ssr-virtual-entry",{"propagation":"in-tree","containsHead":false}]],"renderers":[],"clientDirectives":[["idle","(()=>{var i=t=>{let e=async()=>{await(await t())()};\"requestIdleCallback\"in window?window.requestIdleCallback(e):setTimeout(e,200)};(self.Astro||(self.Astro={})).idle=i;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var s=(i,t)=>{let a=async()=>{await(await i())()};if(t.value){let e=matchMedia(t.value);e.matches?a():e.addEventListener(\"change\",a,{once:!0})}};(self.Astro||(self.Astro={})).media=s;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var l=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let a of e)if(a.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=l;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000noop-middleware":"_noop-middleware.mjs","/src/pages/api/comments/index.ts":"chunks/pages/index_BWRUAfIT.mjs","/node_modules/astro/dist/assets/endpoint/node.js":"chunks/pages/node_DWWZmO_8.mjs","\u0000@astrojs-manifest":"manifest_WjUYJJqq.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/node@_@js":"chunks/node_XVF_VGsD.mjs","\u0000@astro-page:src/pages/404@_@astro":"chunks/404_CbkQgfmE.mjs","\u0000@astro-page:src/pages/about@_@astro":"chunks/about_DVVNf3Z1.mjs","\u0000@astro-page:src/pages/api/comments/[id]@_@ts":"chunks/_id__Cjpj-jY_.mjs","\u0000@astro-page:src/pages/api/comments/index@_@ts":"chunks/index_Dr8suRYl.mjs","\u0000@astro-page:src/pages/dev@_@astro":"chunks/dev_ClopT4nc.mjs","\u0000@astro-page:src/pages/playground@_@astro":"chunks/playground_BflkdcsQ.mjs","\u0000@astro-page:src/pages/resume@_@astro":"chunks/resume_529u4q-b.mjs","\u0000@astro-page:src/pages/worker@_@astro":"chunks/worker_DX9iYQbW.mjs","\u0000@astro-page:src/pages/index@_@astro":"chunks/index_DZGpYSTm.mjs","/astro/hoisted.js?q=0":"_astro/hoisted.DCweMbGL.js","/astro/hoisted.js?q=1":"_astro/hoisted.DNrzI03K.js","/astro/hoisted.js?q=2":"_astro/hoisted.DwiKDtVE.js","/astro/hoisted.js?q=5":"_astro/hoisted.UT1_z9g_.js","@astrojs/vue/client.js":"_astro/client.DRjzQTPS.js","/astro/hoisted.js?q=4":"_astro/hoisted.D2vAJj9A.js","~/components/vue-components/3DExperience.vue":"_astro/3DExperience.SKXxIhET.js","/astro/hoisted.js?q=6":"_astro/hoisted.DOWkbh01.js","/home/avik/dev/absent-antimatter/node_modules/dompurify/dist/purify.es.js":"_astro/purify.es.BiE3P7Td.js","~/components/common/ScratchEmailReveal.vue":"_astro/ScratchEmailReveal.Dj7SXZgb.js","/home/avik/dev/absent-antimatter/node_modules/html2canvas/dist/html2canvas.esm.js":"_astro/html2canvas.esm.BfxBtG_O.js","/home/avik/dev/absent-antimatter/node_modules/canvg/lib/index.es.js":"_astro/index.es.CL-pnpJt.js","/astro/hoisted.js?q=3":"_astro/hoisted.GCGNkxTi.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/_astro/about.BkNwpbDv.css","/earthbump1k.jpg","/favicon.svg","/monkey.glb","/_astro/3DExperience.CUKWE0MZ.js","/_astro/3DExperience.SKXxIhET.js","/_astro/ScratchEmailReveal.Dj7SXZgb.js","/_astro/_commonjsHelpers.Cpj98o6Y.js","/_astro/_plugin-vue_export-helper.DlAUqK2U.js","/_astro/client.DRjzQTPS.js","/_astro/createHelloOnClient.GhKrVVmF.js","/_astro/hoisted.DCweMbGL.js","/_astro/hoisted.DOWkbh01.js","/_astro/hoisted.GCGNkxTi.js","/_astro/hoisted.UT1_z9g_.js","/_astro/html2canvas.esm.BfxBtG_O.js","/_astro/index.es.CL-pnpJt.js","/_astro/preload-helper.BiBI96sQ.js","/_astro/purify.es.BiE3P7Td.js","/_astro/runtime-core.esm-bundler.Be88r5te.js","/_astro/runtime-dom.esm-bundler.DXH6Vk19.js","/_astro/worker-mldGVRNZ.js","/404.html","/about/index.html","/playground/index.html","/resume/index.html","/worker/index.html","/index.html"],"buildFormat":"directory","checkOrigin":false,"rewritingEnabled":false});

export { AstroIntegrationLogger as A, Logger as L, getEventPrefix as g, levels as l, manifest };
