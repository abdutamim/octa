const OCTA_MARK_SRC = new URL('../assets/octa-code-mark.svg', import.meta.url).href

export function OctaMark({
  className,
  alt = ''
}: {
  className?: string
  alt?: string
}): React.JSX.Element {
  return <img aria-hidden={alt ? undefined : true} alt={alt} className={className} src={OCTA_MARK_SRC} />
}
