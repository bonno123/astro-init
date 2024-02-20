
type BaseMetaTag =  {
    content: string;
}

type HTML5MetaTag = {
    name: string;
    property?: undefined;
    httpEquiv?: undefined;
} & BaseMetaTag

type RDFaMetaTag = {
    property: string;
    name?: undefined;
    httpEquiv?: undefined;
} & BaseMetaTag

type HTTPEquivMetaTag = {
    httpEquiv:
        | 'content-security-policy'
        | 'content-type'
        | 'default-style'
        | 'x-ua-compatible'
        | 'refresh';
    name?: undefined;
    property?: undefined;
} & BaseMetaTag

type MetaTag = HTML5MetaTag | RDFaMetaTag | HTTPEquivMetaTag;

type LinkTag = {
    rel: string;
    href: string;
    sizes?: string;
    media?: string;
    type?: string;
    color?: string;
    as?: string;
    crossOrigin?: string;
}

type scriptTagAttributes = {
    src?: string;
    type?: string;
    nomodule?: string;
    async?: string;
    defer?: string;
    crossorigin?: string;
    integrity?: string;
    referrerpolicy?: string;
    blocking?: string;
    fetchpriority?: string;
} 

export type AstroSeoProps = {
    title?: string;
    titleTemplate?: string;
    noindex?: boolean;
    nofollow?: boolean;
    robotsProps?: AdditionalRobotsProps;
    description?: string;
    canonical?: string;
    mobileAlternate?: MobileAlternate;
    languageAlternates?: ReadonlyArray<LanguageAlternate>;
    openGraph?: OpenGraph;
    facebook?: { appId: string };
    twitter?: Twitter;
    additionalMetaTags?: ReadonlyArray<MetaTag>;
    additionalLinkTags?: ReadonlyArray<LinkTag>;
    additionalScriptTags?: ReadonlyArray<scriptTagAttributes>;
}