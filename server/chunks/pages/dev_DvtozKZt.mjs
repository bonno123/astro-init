import { c as createAstro, d as createComponent, r as renderTemplate, e as addAttribute, s as spreadAttributes, u as unescapeHTML, f as renderComponent, g as renderHead, m as maybeRenderHead, h as renderSlot } from '../astro_CCI5kFjB.mjs';
import 'kleur/colors';
import { d as db, C as Comment } from './_id__msVgOrBb.mjs';
import 'clsx';
/* empty css                          */
/* empty css                          */

const $$Astro$b = createAstro("https://avikbanik.com");
const $$OpenGraphArticleTags = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$b, $$props, $$slots);
  Astro2.self = $$OpenGraphArticleTags;
  const { publishedTime, modifiedTime, expirationTime, authors, section, tags } = Astro2.props.openGraph.article;
  return renderTemplate`${publishedTime ? renderTemplate`<meta property="article:published_time"${addAttribute(publishedTime, "content")}>` : null}${modifiedTime ? renderTemplate`<meta property="article:modified_time"${addAttribute(modifiedTime, "content")}>` : null}${expirationTime ? renderTemplate`<meta property="article:expiration_time"${addAttribute(expirationTime, "content")}>` : null}${authors ? authors.map((author) => renderTemplate`<meta property="article:author"${addAttribute(author, "content")}>`) : null}${section ? renderTemplate`<meta property="article:section"${addAttribute(section, "content")}>` : null}${tags ? tags.map((tag) => renderTemplate`<meta property="article:tag"${addAttribute(tag, "content")}>`) : null}`;
}, "/home/avik/dev/absent-antimatter/node_modules/astro-seo/src/components/OpenGraphArticleTags.astro", void 0);

const $$Astro$a = createAstro("https://avikbanik.com");
const $$OpenGraphBasicTags = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$a, $$props, $$slots);
  Astro2.self = $$OpenGraphBasicTags;
  const { openGraph } = Astro2.props;
  return renderTemplate`<meta property="og:title"${addAttribute(openGraph.basic.title, "content")}><meta property="og:type"${addAttribute(openGraph.basic.type, "content")}><meta property="og:image"${addAttribute(openGraph.basic.image, "content")}><meta property="og:url"${addAttribute(openGraph.basic.url || Astro2.url.href, "content")}>`;
}, "/home/avik/dev/absent-antimatter/node_modules/astro-seo/src/components/OpenGraphBasicTags.astro", void 0);

const $$Astro$9 = createAstro("https://avikbanik.com");
const $$OpenGraphImageTags = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$9, $$props, $$slots);
  Astro2.self = $$OpenGraphImageTags;
  const { image } = Astro2.props.openGraph.basic;
  const { secureUrl, type, width, height, alt } = Astro2.props.openGraph.image;
  return renderTemplate`<meta property="og:image:url"${addAttribute(image, "content")}>${secureUrl ? renderTemplate`<meta property="og:image:secure_url"${addAttribute(secureUrl, "content")}>` : null}${type ? renderTemplate`<meta property="og:image:type"${addAttribute(type, "content")}>` : null}${width ? renderTemplate`<meta property="og:image:width"${addAttribute(width, "content")}>` : null}${height ? renderTemplate`<meta property="og:image:height"${addAttribute(height, "content")}>` : null}${alt ? renderTemplate`<meta property="og:image:alt"${addAttribute(alt, "content")}>` : null}`;
}, "/home/avik/dev/absent-antimatter/node_modules/astro-seo/src/components/OpenGraphImageTags.astro", void 0);

const $$Astro$8 = createAstro("https://avikbanik.com");
const $$OpenGraphOptionalTags = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$8, $$props, $$slots);
  Astro2.self = $$OpenGraphOptionalTags;
  const { optional } = Astro2.props.openGraph;
  return renderTemplate`${optional.audio ? renderTemplate`<meta property="og:audio"${addAttribute(optional.audio, "content")}>` : null}${optional.description ? renderTemplate`<meta property="og:description"${addAttribute(optional.description, "content")}>` : null}${optional.determiner ? renderTemplate`<meta property="og:determiner"${addAttribute(optional.determiner, "content")}>` : null}${optional.locale ? renderTemplate`<meta property="og:locale"${addAttribute(optional.locale, "content")}>` : null}${optional.localeAlternate?.map((locale) => renderTemplate`<meta property="og:locale:alternate"${addAttribute(locale, "content")}>`)}${optional.siteName ? renderTemplate`<meta property="og:site_name"${addAttribute(optional.siteName, "content")}>` : null}${optional.video ? renderTemplate`<meta property="og:video"${addAttribute(optional.video, "content")}>` : null}`;
}, "/home/avik/dev/absent-antimatter/node_modules/astro-seo/src/components/OpenGraphOptionalTags.astro", void 0);

const $$Astro$7 = createAstro("https://avikbanik.com");
const $$ExtendedTags = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$7, $$props, $$slots);
  Astro2.self = $$ExtendedTags;
  const { props } = Astro2;
  return renderTemplate`${props.extend.link?.map((attributes) => renderTemplate`<link${spreadAttributes(attributes)}>`)}${props.extend.meta?.map(({ content, httpEquiv, media, name, property }) => renderTemplate`<meta${addAttribute(name, "name")}${addAttribute(property, "property")}${addAttribute(content, "content")}${addAttribute(httpEquiv, "http-equiv")}${addAttribute(media, "media")}>`)}`;
}, "/home/avik/dev/absent-antimatter/node_modules/astro-seo/src/components/ExtendedTags.astro", void 0);

const $$Astro$6 = createAstro("https://avikbanik.com");
const $$TwitterTags = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$6, $$props, $$slots);
  Astro2.self = $$TwitterTags;
  const { card, site, title, creator, description, image, imageAlt } = Astro2.props.twitter;
  return renderTemplate`${card ? renderTemplate`<meta name="twitter:card"${addAttribute(card, "content")}>` : null}${site ? renderTemplate`<meta name="twitter:site"${addAttribute(site, "content")}>` : null}${title ? renderTemplate`<meta name="twitter:title"${addAttribute(title, "content")}>` : null}${image ? renderTemplate`<meta name="twitter:image"${addAttribute(image, "content")}>` : null}${imageAlt ? renderTemplate`<meta name="twitter:image:alt"${addAttribute(imageAlt, "content")}>` : null}${description ? renderTemplate`<meta name="twitter:description"${addAttribute(description, "content")}>` : null}${creator ? renderTemplate`<meta name="twitter:creator"${addAttribute(creator, "content")}>` : null}`;
}, "/home/avik/dev/absent-antimatter/node_modules/astro-seo/src/components/TwitterTags.astro", void 0);

const $$Astro$5 = createAstro("https://avikbanik.com");
const $$LanguageAlternatesTags = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$5, $$props, $$slots);
  Astro2.self = $$LanguageAlternatesTags;
  const { languageAlternates } = Astro2.props;
  return renderTemplate`${languageAlternates.map((alternate) => renderTemplate`<link rel="alternate"${addAttribute(alternate.hrefLang, "hreflang")}${addAttribute(alternate.href, "href")}>`)}`;
}, "/home/avik/dev/absent-antimatter/node_modules/astro-seo/src/components/LanguageAlternatesTags.astro", void 0);

const $$Astro$4 = createAstro("https://avikbanik.com");
const $$SEO = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$4, $$props, $$slots);
  Astro2.self = $$SEO;
  Astro2.props.surpressWarnings = true;
  function validateProps(props) {
    if (props.openGraph) {
      if (!props.openGraph.basic || (props.openGraph.basic.title ?? void 0) == void 0 || (props.openGraph.basic.type ?? void 0) == void 0 || (props.openGraph.basic.image ?? void 0) == void 0) {
        throw new Error(
          "If you pass the openGraph prop, you have to at least define the title, type, and image basic properties!"
        );
      }
    }
    if (props.title && props.openGraph?.basic.title) {
      if (props.title == props.openGraph.basic.title && !props.surpressWarnings) {
        console.warn(
          "WARNING(astro-seo): You passed the same value to `title` and `openGraph.optional.title`. This is most likely not what you want. See docs for more."
        );
      }
    }
    if (props.openGraph?.basic?.image && !props.openGraph?.image?.alt && !props.surpressWarnings) {
      console.warn(
        "WARNING(astro-seo): You defined `openGraph.basic.image`, but didn't define `openGraph.image.alt`. This is strongly discouraged.'"
      );
    }
  }
  validateProps(Astro2.props);
  let updatedTitle = "";
  if (Astro2.props.title) {
    updatedTitle = Astro2.props.title;
    if (Astro2.props.titleTemplate) {
      updatedTitle = Astro2.props.titleTemplate.replace(/%s/g, updatedTitle);
    }
  } else if (Astro2.props.titleDefault) {
    updatedTitle = Astro2.props.titleDefault;
  }
  return renderTemplate`${updatedTitle ? renderTemplate`<title>${unescapeHTML(updatedTitle)}</title>` : null}${Astro2.props.charset ? renderTemplate`<meta${addAttribute(Astro2.props.charset, "charset")}>` : null}<link rel="canonical"${addAttribute(Astro2.props.canonical || Astro2.url.href, "href")}>${Astro2.props.description ? renderTemplate`<meta name="description"${addAttribute(Astro2.props.description, "content")}>` : null}<meta name="robots"${addAttribute(`${Astro2.props.noindex ? "noindex" : "index"}, ${Astro2.props.nofollow ? "nofollow" : "follow"}`, "content")}>${Astro2.props.openGraph && renderTemplate`${renderComponent($$result, "OpenGraphBasicTags", $$OpenGraphBasicTags, { ...Astro2.props })}`}${Astro2.props.openGraph?.optional && renderTemplate`${renderComponent($$result, "OpenGraphOptionalTags", $$OpenGraphOptionalTags, { ...Astro2.props })}`}${Astro2.props.openGraph?.image && renderTemplate`${renderComponent($$result, "OpenGraphImageTags", $$OpenGraphImageTags, { ...Astro2.props })}`}${Astro2.props.openGraph?.article && renderTemplate`${renderComponent($$result, "OpenGraphArticleTags", $$OpenGraphArticleTags, { ...Astro2.props })}`}${Astro2.props.twitter && renderTemplate`${renderComponent($$result, "TwitterTags", $$TwitterTags, { ...Astro2.props })}`}${Astro2.props.extend && renderTemplate`${renderComponent($$result, "ExtendedTags", $$ExtendedTags, { ...Astro2.props })}`}${Astro2.props.languageAlternates && renderTemplate`${renderComponent($$result, "LanguageAlternatesTags", $$LanguageAlternatesTags, { ...Astro2.props })}`}`;
}, "/home/avik/dev/absent-antimatter/node_modules/astro-seo/src/SEO.astro", void 0);

const siteInfo = {
  title: `%s | ${"Avik Banik"}`,
  description: `3D web design, 
		built with Astro TypeScript, TresJS, super fast static sites; 
		loading animations, while loading the client-side JavaScript.
		examples of webgl, GLSL, and 3D web development in the browser
	`,
  image: {
    src: "/og/social.jpg",
    alt: "Build the web you want"
  }
};
const heroWidget = {
  title: "Landing",
  description: "3D landing page with minimalistic design",
  heroContent: {
    title: "Here’s a clean piece of paper",
    description: `I guess you are a bit early here. 🤔 Yup, I am still working on this page!
		<br>
		<br>
		Here, I have planned to share my GLSL design *playground/*.

		<br>
		<br>
		Meanwhile, you can check out my social profiles or know *about/* me.
		`
  },
  socialLinks: [
    {
      platform: "github",
      href: "https://github.com/bonno123/astro-init",
      me: "https://github.com/bonno123",
      text: "Go to GitHub repo",
      icon: "social/github"
    },
    {
      platform: "twitter",
      href: "https://twitter.com/AvikBanik1",
      me: "https://twitter.com/AvikBanik1",
      text: "Follow on Twitter",
      icon: "social/twitter"
    },
    {
      platform: "kaggle",
      href: "https://www.kaggle.com/avikbanik",
      me: "https://www.kaggle.com/avikbanik",
      text: "Follow on kaggle",
      footerOnly: true,
      icon: "social/kaggle"
    },
    {
      platform: "codepen",
      href: "https://codepen.io/Bonno123",
      me: "https://codepen.io/Bonno123",
      text: "Follow on kaggle",
      footerOnly: true,
      icon: "social/codepen"
    }
  ]
};
const aboutMeWidget = {
  title: "About Me",
  description: "portfolio of software engineer, web developer.",
  aboutMe: {
    title: "Hello, I’m Avik",
    description: `
		I am a software engineer and web developer based in Kolkata, India.
		<br/>
		It's been 3 years since I started my tech journey.
		Worked with various technologies and frameworks like Vue.js, Quasar, Node.js, FastAPI, and databases like Oracle, postgreSQL with Prisma ORM.
		<br/><br/>
		I am currently working as a software engineer at a startup called RentApp.
		And also a part-time freelancer and have worked with clients from the UK(Slovakia), and India.
		I am always open to new opportunities.
		<br/><br/>
		Feel free to email me or connect with me on any of the following options! 
    	`,
    mail: "contact@avikbanik.com"
  },
  socialLinks: [
    {
      label: "X",
      link: "https://twitter.com/avikbanik1"
    },
    {
      label: "Github",
      link: "https://github.com/bonno123"
    },
    {
      label: "Linkedin",
      link: "https://www.linkedin.com/in/avik-banik-38b097140/"
    },
    {
      label: "Codepen",
      link: "https://codepen.io/Bonno123"
    },
    {
      label: "Kaggle",
      link: "https://www.kaggle.com/avikbanik"
    },
    {
      label: "Instagram",
      link: "https://www.instagram.com/_sporadikos_/"
    }
  ]
};

function formatCanonicalURL(url) {
  const path = url.toString();
  const hasQueryParams = path.includes("?");
  if (hasQueryParams) {
    path.replace(/\/?$/, "");
  }
  return path.replace(/\/?$/, hasQueryParams ? "" : "/");
}

const $$Astro$3 = createAstro("https://avikbanik.com");
const $$BaseHeadSeo = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$BaseHeadSeo;
  const baseTitle = Astro2.props.title || "Avik Banik";
  const image = siteInfo.image;
  const canonicalURL = new URL(Astro2.request.url, Astro2.site);
  const locale = "en";
  const openGraphDescriptiveTitle = [
    Astro2.props.title,
    "Avik Banik"
  ].filter(Boolean).join(" | ");
  const openGraph = {
    basic: {
      title: openGraphDescriptiveTitle,
      type: "website",
      image: "https://raw.githubusercontent.com/bonno123/astro-init/b31272c3ad24b9e7c46ef4ce97e424ddb8ccdef4/code_20231222_181000_via_10015_io.png",
      url: formatCanonicalURL(canonicalURL)
    },
    image: {
      alt: "a pice of javascript code declres an object of user info"
    },
    optional: {
      locale
    }
  };
  const twitter = {
    title: baseTitle,
    creator: "AvikBanik",
    site: String(canonicalURL),
    description: openGraphDescriptiveTitle,
    image: image.src,
    imageAlt: image.alt,
    card: "summary_large_image",
    ...Astro2.props.twitter
  };
  const ExtendTags = {
    link: [
      {
        rel: "icon",
        href: "/favicon.svg",
        type: "image/svg+xml"
      }
    ],
    meta: [
      {
        name: "google-site-verification",
        content: "EdyNLS3IiOR2mQtxpM3M9itZfLqehGXkHUdav6MbDY4"
      }
    ]
  };
  return renderTemplate`${renderComponent($$result, "SEO", $$SEO, { "title": baseTitle, "titleTemplate": siteInfo.title, "description": `${Astro2.props.metaDescription}, ${siteInfo.description}`, "canonical": canonicalURL, "openGraph": openGraph, "twitter": twitter, "extend": ExtendTags })}`;
}, "/home/avik/dev/absent-antimatter/src/components/BaseHeadSeo.astro", void 0);

const $$Astro$2 = createAstro("https://avikbanik.com");
const $$BaseHead = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$BaseHead;
  const { title, metaDescription } = Astro2.props;
  return renderTemplate`<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><meta name="generator"${addAttribute(Astro2.generator, "content")}>${renderComponent($$result, "BaseHeadSeo", $$BaseHeadSeo, { "title": title, "metaDescription": metaDescription })}${renderHead()}</head>`;
}, "/home/avik/dev/absent-antimatter/src/components/common/BaseHead.astro", void 0);

const $$Astro$1 = createAstro("https://avikbanik.com");
const $$MainLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$MainLayout;
  const { title: layoutTitle, metaDescription } = Astro2.props;
  return renderTemplate`<html lang="en"> ${renderComponent($$result, "BaseHead", $$BaseHead, { "title": layoutTitle, "metaDescription": metaDescription })}${maybeRenderHead()}<body> <main> ${renderSlot($$result, $$slots["default"])} </main> </body></html>`;
}, "/home/avik/dev/absent-antimatter/src/layouts/MainLayout.astro", void 0);

const $$Astro = createAstro("https://avikbanik.com");
const $$EvenColumnsLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$EvenColumnsLayout;
  const {
    as: Element = "section",
    class: providerClass,
    ...props
  } = Astro2.props;
  return renderTemplate`${renderComponent($$result, "Element", Element, { "class:list": [providerClass, ["padding-block-900"]], ...props, "data-astro-cid-aui7cjyt": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page-container" data-astro-cid-aui7cjyt> <div class="even-columns" data-astro-cid-aui7cjyt> ${renderSlot($$result2, $$slots["default"])} </div> </div> ` })} `;
}, "/home/avik/dev/absent-antimatter/src/layouts/EvenColumnsLayout.astro", void 0);

const prerender = false;
const $$Dev = createComponent(async ($$result, $$props, $$slots) => {
  const comments = await db.select().from(Comment);
  return renderTemplate`${renderComponent($$result, "MainLayout", $$MainLayout, { "title": heroWidget.title, "metaDescription": heroWidget.description }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "EvenColumnsLayout", $$EvenColumnsLayout, {}, { "default": ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="fs-600"> ${comments.map(({ id, authorId, content, flagged, likes, metadata, published }) => renderTemplate`<article class="padding-block-400"> <p>Comment Id: ${id}</p> <p>AuthorId: ${authorId}</p> <p>Content: ${content}</p> <p>Flagged: ${flagged}</p> <p>Likes: ${likes}</p> <div class=""> <p> Metadata: ${Object.keys(metadata).map((key) => renderTemplate`<p class="padding-inline-900">${key}: ${metadata[key]}</p>`)}</p> </div> <p>Published: ${published}</p> <button${addAttribute(id, "data-id")} aria-label="delete comment">
Delete
</button> </article>`)} </div> <div class=""> <form style="display: grid" id="add-comment"> <label for="author">Author ID</label> <input id="author" name="authorID" type="number"> <label for="content">Content</label> <textarea id="content" name="content"></textarea> <button class="margin-top-400" type="submit">Submit</button> </form> </div> ` })} ` })} `;
}, "/home/avik/dev/absent-antimatter/src/pages/dev.astro", void 0);

const $$file = "/home/avik/dev/absent-antimatter/src/pages/dev.astro";
const $$url = "/dev/";

const dev = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Dev,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

export { $$EvenColumnsLayout as $, $$MainLayout as a, aboutMeWidget as b, dev as d, heroWidget as h };
