import * as vscode from 'vscode'
import { createSnippetString, registerInlineCompletionItemProvider } from '@vscode-use/utils'
import Claude from 'anthropic-ai'

export function activate() {
  const claude = new Claude('')
  const cacheMap: any = new Map()
  const fn = throttle(update)
  let text = ''
  async function update() {
    try {
      if (cacheMap.has(text))
        return new vscode.InlineCompletionList([
          new vscode.InlineCompletionItem(cacheMap.get(new vscode.InlineCompletionItem(text))),
        ])

      const data = await claude.complete(`我需要你和copilot一样,帮我推测我接下来要写的代码,请只保留推断的结果\n代码:\n${text}`, {
        model: '1.3-100k',
      })
      const snip = createSnippetString(data)
      cacheMap.set(text, snip)
      return new vscode.InlineCompletionList([
        new vscode.InlineCompletionItem(snip),
      ])
    }
    catch (e) {
      
    }
  }
  registerInlineCompletionItemProvider(
    async (document) => {
      text = document.getText().trim()
      if (!text)
        return
      return await fn() as any
    },
  )
}

export function deactivate() {

}

function throttle(fn: () => void, ms = 500) {
  let timer: any = null
  return function () {
    return new Promise((resolve) => {
      if (timer)
        clearTimeout(timer)
      timer = setTimeout(() => {
        const result = fn()
        resolve(result)
      }, ms)
    })
  }
}
