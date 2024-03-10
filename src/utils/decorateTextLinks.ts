export function decorateTextLinks(
  str: string, 
) {
  return str.replace(
    /\*{1,2}(.*?)\*{1,2}/g,
    `<a
      class="fw-medium"
      href="$1" 
    >
    <span class="sr-only">{$1} link</span>
    $1
    </a>`
  );
}
