export function decorateTextLinks(
  str: string, 
) {
  return str.replace(
    /\*{1,2}(.*?)\*{1,2}/g,
    `<a
      class="fw-bold text-accent"
      href="$1" 
    >
    <span class="sr-only">{$1} link</span>
    $1
    </a>`
  );
}
