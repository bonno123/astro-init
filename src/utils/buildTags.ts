import { escape } from "html-escaper";
import type { AstroSeoProps, scriptTagAttributes } from "~/types";

const createMetaTag = (attributes: Record<string, string>): string => {
  const attrs = Object.entries(attributes)
    .map(([key, value]) => `${key}="${escape(value)}"`)
    .join(" ");
  return `<meta ${attrs} />`;
};

const createLinkTag = (attributes: Record<string, string>): string => {
  const attrs = Object.entries(attributes)
    .map(([key, value]) => `${key}="${escape(value)}"`)
    .join(" ");
  return `<link ${attrs} />`;
};

const createScriptTag = (attributes: scriptTagAttributes): string => {
  const attrs = Object.entries(attributes)
    .map(([key, value]) => `${key}="${escape(value)}"`)
    .join(" ");
  return `<script ${attrs} />`;
};

export const buildTags = (config: AstroSeoProps): string => {
  let tagsToRender = "";

  const addTag = (tag: string) => {
    tagsToRender += tag + "\n";
  };

  // Description
  if (config.description) {
    addTag(createMetaTag({ name: "description", content: config.description }));
  }

  // Robots: noindex, nofollow, and other robotsProps
  let robotsContent: string[] = [];
  if (typeof config.noindex !== "undefined") {
    robotsContent.push(config.noindex ? "noindex" : "index");
  }

  if (typeof config.nofollow !== "undefined") {
    robotsContent.push(config.nofollow ? "nofollow" : "follow");
  }

  if (config.robotsProps) {
    const { nosnippet, maxSnippet, maxImagePreview, noarchive, unavailableAfter, noimageindex, notranslate } =
      config.robotsProps;

    if (nosnippet) robotsContent.push("nosnippet");
    if (maxSnippet) robotsContent.push(`max-snippet:${maxSnippet}`);
    if (maxImagePreview) robotsContent.push(`max-image-preview:${maxImagePreview}`);
    if (noarchive) robotsContent.push("noarchive");
    if (unavailableAfter) robotsContent.push(`unavailable_after:${unavailableAfter}`);
    if (noimageindex) robotsContent.push("noimageindex");
    if (notranslate) robotsContent.push("notranslate");
  }

  // Additional Meta Tags
  if (config.additionalMetaTags && config.additionalMetaTags.length > 0) {
    config.additionalMetaTags.forEach((metaTag) => {
      const attributes: Record<string, string> = {
        content: metaTag.content,
      };

      if ("name" in metaTag && metaTag.name) {
        attributes.name = metaTag.name;
      } else if ("property" in metaTag && metaTag.property) {
        attributes.property = metaTag.property;
      } else if ("httpEquiv" in metaTag && metaTag.httpEquiv) {
        attributes["http-equiv"] = metaTag.httpEquiv;
      }

      addTag(createMetaTag(attributes));
    });
  }

  // Additional Link Tags
  if (config.additionalLinkTags && config.additionalLinkTags.length > 0) {
    config.additionalLinkTags.forEach((linkTag) => {
      const attributes: Record<string, string> = {
        rel: linkTag.rel,
        href: linkTag.href,
      };

      if (linkTag.sizes) {
        attributes.sizes = linkTag.sizes;
      }
      if (linkTag.media) {
        attributes.media = linkTag.media;
      }
      if (linkTag.type) {
        attributes.type = linkTag.type;
      }
      if (linkTag.color) {
        attributes.color = linkTag.color;
      }
      if (linkTag.as) {
        attributes.as = linkTag.as;
      }
      if (linkTag.crossOrigin) {
        attributes.crossorigin = linkTag.crossOrigin;
      }

      addTag(createLinkTag(attributes));
    });
  }

  // Additional Script Tags
  if (config.additionalScriptTags && config.additionalScriptTags.length > 0) {
    config.additionalScriptTags.forEach((scriptTag) => {
      const attributes = {
        src: scriptTag.src,
        type: scriptTag?.type,
      };

      if (scriptTag.src) {
        attributes.src = scriptTag.src;
      }
      if (scriptTag.type) {
        attributes.type = scriptTag.type;
      }

      addTag(createScriptTag(attributes));
    });
  }

  return tagsToRender.trim();
};
