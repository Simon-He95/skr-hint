// 根据内容和当前行去查找这个文字的域
// 1. 如果当前是vue
export function findArea(content: string, lineText: string, line: number, type: string) {
  if (type === 'vue')
    return vueFind(content, lineText, line)
  return commonFind(content, lineText, line)
}

function vueFind(content: string, lineText: string, line: number) {
  const script = content.match(/<script[^>]*>.*<\/script>/s)?.[0]
  if (!script)
    return
  let startLine
  let endLine
  let i = 0
  for (const item of script.split('\n')) {
    if (startLine && (startLine > line))
      return
    if (endLine && (endLine < line))
      return
    if (startLine === undefined && (i > line))
      return
    if (/<script[^>]*>/.test(item))
      startLine = i

    if (/<\/script>/.test(item)) {
      endLine = i
      if (endLine < line)
        return
      break
    }
    i++
  }
  return commonFind(script, lineText, line)
}

function commonFind(content: string, lineText: string, line: number) {
  const contents = content.split('\n')
  let isBlock = false
  let end = line
  let start = line - 1
  for (let i = line + 1; i < contents.length; i++) {
    const _lineText = contents[i]
    if (_lineText.trim() === '}') {
      isBlock = true
      end = i + 1
    }
    else if (_lineText.trim() === '') {
      continue
    }
    break
  }
  if (!isBlock)
    return lineText || contents[line - 1]
  let stack = 0
  for (let i = line; i >= 0; i--) {
    const _lineText = contents[i]
    if (_lineText.includes('}'))
      stack++
    if (_lineText.includes('{') && stack === 0) {
      start = i
      break
    }
    else if (_lineText.includes('{')) {
      stack--
    }
  }
  return contents.slice(start, end).join('\n')
}
