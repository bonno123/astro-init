/**
 * Content for the one-page site.
 *
 * Everything the page says lives here; nothing else needs to change.
 */

/** PUBLIC_CONTACT_EMAIL if it is a real address, else the one the old site used. */
function contactEmail() {
  const v = (import.meta.env.PUBLIC_CONTACT_EMAIL ?? "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : "hello@avikb.dev";
}

export const site = {
  name: "Avik Banik",
  role: "Product engineer",
  /** Shown as a chip in the hero, linking to "say hi". Set to null when booked up. */
  availability: "open to new work" as string | null,
  domain: "avikb.dev",
  tagline:
    "I build things for the internet. Frontend by habit, the rest by need. Now with AI, and picky about what ships.",
  place: "Bardhaman",
  coords: "23.23° N · 87.86° E",
  timeZone: "Asia/Kolkata",
  replyWithinDays: 2,
  email: contactEmail(),
  links: {
    github: "https://github.com/bonno123",
    codepen: "https://codepen.io/Bonno123",
  },
};

export const currently = {
  month: "NOV 2026",
  /** `{bc}` is replaced by an accented "Bardhaman Connect". */
  text: "Open to new work. Still close to VisibleMoney, and rooting for the movement around it. On the side, slowly building {bc}.",
};

export const visibleMoney = {
  years: "since 2021 · contract, on and off",
  name: "VisibleMoney",
  quote: "Trust deserves evidence.",
  body: "An open platform for evidence-led trust. People and organisations declare what they own, choose how much of it to show, and let others audit it. I build the web side: the declaration and audit screens, the back office, and the Vue component library they share. Lately, the API and database changes behind them too.",
  stats: [
    { n: "3", label: "APPS" },
    { n: "20+", label: "LANGUAGES" },
  ],
  stack: "Vue · Quasar · i18n · design system · FastAPI",
  around: [
    {
      year: "2026",
      name: "Enroute to a Better Society",
      line: "The founder’s book on how VisibleMoney came to be, from Slovak into English. About 23,000 words.",
      role: "English edition" as string | null,
    },
  ],
  links: [
    { label: "visiblemoney.org", href: "https://visiblemoney.org" },
  ],
};

export const bardhamanConnect = {
  status: "side project · no launch date",
  name: "Bardhaman Connect",
  body: "A marketplace for one district: local services, products, rentals and bookings, in Bangla and English. Small enough to know who it's for.",
  stats: [
    { n: "16", label: "MODULES" },
    { n: "440+", label: "COMMITS" },
    { n: "2", label: "LANGUAGES" },
  ],
  detail:
    "Idempotent orders, a Postgres job queue, Playwright on the paths where money moves.",
  stack: "Nuxt 4 · PostgreSQL · R2 · Docker",
};

/** Small experiments. Listed as what they are, with no promise to continue. */
export const sketches: { year: string; name: string; line: string }[] = [
  { year: "2026", name: "Gachh", line: "A Bangla-first plant shop for Bardhaman." },
  { year: "2026", name: "Compiler", line: "A compiler inside a 32-bit container. No reason." },
  { year: "2024", name: "Shader lab", line: "Light, noise, and The Book of Shaders." },
  { year: "2017", name: "Algorithms", line: "The oldest folder I still open." },
];

/** Grouped by what the tools are for, not ranked. Only things used on real work. */
export const toolbox = [
  { k: "INTERFACES", v: "Vue, Nuxt, Quasar, Astro, TypeScript; component libraries, design systems, i18n" },
  { k: "SERVERS", v: "Node, Python with FastAPI, Cloudflare Workers" },
  { k: "DATA", v: "PostgreSQL (schemas, migrations, job queues), Cloudflare D1" },
  { k: "SHIPPING", v: "Docker, Cloudflare R2, GitHub Actions, Playwright" },
  { k: "GRAPHICS", v: "WebGL, GLSL shaders, Three.js" },
  { k: "AI", v: "Claude Code, GitHub Copilot, and whatever works next" },
];

export const asks = [
  "building for a small town",
  "evidence-led trust",
  "Vue component libraries",
  "shaders",
  "building with AI agents",
];

export const declared = [
  { k: "WORK", v: "Freelance product engineer" },
  { k: "HOW I WORK", v: "With AI agents, from plan to test. I set the goal, judge the result, and decide what ships." },
  { k: "LEARNED ON", v: "JavaScript, Vue, CSS and Quasar, by hand, from the docs" },
  { k: "MOSTLY FOR", v: "VisibleMoney, on contracts since 2021" },
  { k: "OPEN TO", v: "Products end to end or frontend-led; component libraries; anything where money or places matter" },
  { k: "STUDIED", v: "B.Tech and M.Tech, computer science" },
  { k: "BASED IN", v: "West Bengal" },
];

