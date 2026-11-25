/**
 * Content for the one-page site.
 *
 * Anything set to `null` is a slot that is still waiting for real words.
 * Rows with a `null` value are left out of the page, so nothing ships as a
 * "[placeholder]". Fill them in here; nothing else needs to change.
 */

/** PUBLIC_CONTACT_EMAIL if it is a real address, else the one the old site used. */
function contactEmail() {
  const v = (import.meta.env.PUBLIC_CONTACT_EMAIL ?? "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : "hello@avikb.dev";
}

export const site = {
  name: "Avik Banik",
  domain: "avikb.dev",
  tagline:
    "Frontend engineer. Five years on one product. Now building one for my town.",
  /** Shown in the footer and used for "last touched N days ago". */
  updated: "2026-11-25",
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
  text: "Shipping {bc} one module at a time. Still on VisibleMoney, and the movement growing around it. Writing, slowly.",
};

export const visibleMoney = {
  years: "2021 — now · freelance",
  name: "VisibleMoney",
  quote: "Trust deserves evidence.",
  body: "An open platform for evidence-led trust. People and organisations declare what they own, choose how much of it to show, and let others audit it. I build the web side: the declaration and audit screens, the back office, and the Vue component library they share.",
  stats: [
    { n: "5", label: "YEARS" },
    { n: "3", label: "APPS" },
    { n: "20+", label: "LANGUAGES" },
  ],
  stack: "Vue · Quasar · i18n · design system",
  around: [
    {
      year: "2026",
      name: "Humanity United Movement",
      line: "Peter Boško’s initiative for transparent, global, reason-first politics. Members publish an asset declaration on VisibleMoney.",
      /** TODO: your part, e.g. "web, translation". */
      role: null as string | null,
    },
    {
      year: "2026",
      name: "Enroute to a Better Society",
      line: "Peter’s book on how VisibleMoney came to be, from Slovak into English. About 23,000 words.",
      role: "English edition" as string | null,
    },
  ],
  links: [
    { label: "visiblemoney.org", href: "https://visiblemoney.org" },
    { label: "humanityunitedmovement.org", href: "https://humanityunitedmovement.org" },
  ],
};

export const bardhamanConnect = {
  status: "pre-launch · solo",
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

export type Essay = {
  n: string;
  title: string;
  dek?: string;
  meta: string;
  href?: string;
};

export const essays: Essay[] = [
  {
    n: "01",
    title: "On staying",
    dek: "Most freelance work lasts a few weeks. One project has lasted five years. I think staying is a skill nobody puts on a CV.",
    meta: "Nov 2026 · 4 min",
    href: "/writing/on-staying/",
  },
  { n: "02", title: "On building for a small town", meta: "draft" },
];

type Status = "alive" | "ongoing" | "learned" | "for fun" | "paused";

export const alsoMade: { year: string; name: string; status: Status; line: string }[] = [
  { year: "2026", name: "Gachh", status: "alive", line: "A Bangla-first plant shop for Bardhaman. Real customers, real soil." },
  { year: "2026", name: "EduOS", status: "ongoing", line: "Flashcards that remember what you forget. The fifth attempt." },
  { year: "2026", name: "Constitution Memory", status: "ongoing", line: "Learning the Indian constitution, one article at a time." },
  { year: "2026", name: "Bengali TTS", status: "learned", line: "Teaching a machine to read Bangla aloud." },
  { year: "2026", name: "Compiler", status: "for fun", line: "A compiler inside a 32-bit container. No reason." },
  { year: "2025", name: "Kobita", status: "paused", line: "A home for old and new Bengali poems." },
  { year: "2024", name: "Shader lab", status: "alive", line: "Light, noise, and The Book of Shaders." },
  { year: "2017", name: "Algorithms", status: "alive", line: "The oldest folder I still open." },
];

/**
 * People you've made things with. `quote` is optional and should only be
 * filled in with the person's permission.
 */
export const people: { role: string; name: string; quote?: string }[] = [
  { role: "VISIBLEMONEY · SINCE 2021", name: "Peter Boško" },
];

export const life: { k: string; v: string | null }[] = [
  { k: "HOME", v: null /* TODO: "[town], West Bengal" */ },
  { k: "GROWING", v: "Plants (see Gachh)" },
  { k: "READING", v: null },
  { k: "LATELY", v: null },
];

export const asks = [
  "building for a small town",
  "five years on one product",
  "evidence-led trust",
  "Vue component libraries",
  "Bengali text-to-speech",
  "shaders",
];

export const declared = [
  { k: "WORK", v: "Freelance frontend engineer" },
  { k: "MOSTLY FOR", v: "VisibleMoney, since 2021" },
  { k: "OPEN TO", v: "Vue and Nuxt apps, component libraries, interfaces where money or places matter" },
  { k: "NOT LOOKING FOR", v: "A full-time job" },
  { k: "BASED IN", v: "West Bengal" },
];

/** Put a 3:4 photo in /public and set its path here. */
export const photo: { src: string; alt: string } | null = null;
