export function decorateTextLinks(str: string) {
  return str.replace(
    /\*{1,2}(.*?)\*{1,2}/g,
    `<strong class="">$1</strong>`
  );
}
