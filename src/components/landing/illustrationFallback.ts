// Smart onError handler for fish/insect illustrations.
// Tries alternative directory paths, then injects an inline SVG silhouette.
export const handleIllustrationError = (
  e: React.SyntheticEvent<HTMLImageElement>
) => {
  const el = e.currentTarget;
  const src = el.src;
  const filename = src.split('/').pop() || '';
  const alternatives = [
    `/images/fish/${filename}`,
    `/images/insects/${filename}`,
    `/insects/${filename}`,
    `/brown-trout.png`,
  ];
  const currentIndex = alternatives.findIndex((p) =>
    src.includes(p.replace(/^\//, ''))
  );
  const next = alternatives[currentIndex + 1];
  const retries = parseInt(el.dataset.retries || '0', 10);
  if (next && retries < 3) {
    el.dataset.retries = String(retries + 1);
    el.src = next;
  } else {
    el.style.display = 'none';
    el.parentElement?.insertAdjacentHTML(
      'beforeend',
      '<svg viewBox="0 0 100 60" class="w-32 h-20 opacity-30"><path d="M10,30 Q30,10 60,30 Q30,50 10,30 Z M60,30 L80,20 L75,30 L80,40 Z" fill="#4a7c59"/></svg>'
    );
  }
};
