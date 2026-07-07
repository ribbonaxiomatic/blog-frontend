const escapeHtml = (value = '') => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const escapeAttribute = (value = '') => {
  return escapeHtml(value).replace(/`/g, '&#96;')
}

const isSafeHref = (href = '') => {
  return /^(https?:\/\/|\/|#)/i.test(href)
}

const renderInline = (value = '') => {
  let html = escapeHtml(value)

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/\[([^\]]+)]\(([^)]+)\)/g, (_, text, href) => {
    const normalizedHref = href.trim()
    if (!isSafeHref(normalizedHref)) {
      return text
    }
    return `<a href="${escapeAttribute(normalizedHref)}" target="_blank" rel="noopener noreferrer">${text}</a>`
  })

  return html
}

export const renderMarkdown = (markdown = '') => {
  const lines = String(markdown).replace(/\r\n/g, '\n').split('\n')
  const html = []
  let listType = null
  let paragraph = []
  let inCodeBlock = false
  let codeLines = []

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    html.push(`<p>${paragraph.map(renderInline).join('<br>')}</p>`)
    paragraph = []
  }

  const closeList = () => {
    if (!listType) return
    html.push(`</${listType}>`)
    listType = null
  }

  const openList = (type) => {
    if (listType === type) return
    closeList()
    html.push(`<${type}>`)
    listType = type
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
        codeLines = []
        inCodeBlock = false
      } else {
        flushParagraph()
        closeList()
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeLines.push(line)
      continue
    }

    if (!trimmed) {
      flushParagraph()
      closeList()
      continue
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      flushParagraph()
      closeList()
      const level = heading[1].length
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`)
      continue
    }

    const unordered = trimmed.match(/^[-*+]\s+(.+)$/)
    if (unordered) {
      flushParagraph()
      openList('ul')
      html.push(`<li>${renderInline(unordered[1])}</li>`)
      continue
    }

    const ordered = trimmed.match(/^\d+\.\s+(.+)$/)
    if (ordered) {
      flushParagraph()
      openList('ol')
      html.push(`<li>${renderInline(ordered[1])}</li>`)
      continue
    }

    paragraph.push(line)
  }

  if (inCodeBlock) {
    html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
  }
  flushParagraph()
  closeList()

  return html.join('')
}
