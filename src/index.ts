import * as vscode from 'vscode'
import { createSnippetString, registerInlineCompletionItemProvider } from '@vscode-use/utils'
import Claude from 'anthropic-ai'

const claude = new Claude('')
export function activate() {
  const cacheMap: any = new Map()
  const fn = throttle(update)
  let text = ''
  async function update() {
    try {
      if (cacheMap.has(text)) {
        return new vscode.InlineCompletionList([
          new vscode.InlineCompletionItem(cacheMap.get(text)),
          new vscode.InlineCompletionItem(cacheMap.get(text)),
        ])
      }

      const data = await request(10, `假如你是copilotX,推断我接下来的代码,并只保留推断的结果\n代码:\n${text}`) as string
      if (!data)
        return []
      const snip = createSnippetString(data.trim().replace(/\n+/g, '\n'))
      cacheMap.set(text, snip)

      return new vscode.InlineCompletionList([
        new vscode.InlineCompletionItem(snip),
        new vscode.InlineCompletionItem(snip),
      ])
    }
    catch (e) {
      return []
    }
  }
  registerInlineCompletionItemProvider(
    async (document) => {
      text = document.getText().trim()
      if (!text)
        return []
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

function request(max = 10, text: string) {
  const array = new Array(max).fill(0)
  return new Promise((resolve) => {
    Promise.race(array.map(() => {
      return new Promise((resolve) => {
        claude.complete(`假如你是copilotX,推断我接下来的代码,并只保留推断的结果\n代码:\n${text}`, {
          model: '1.3',
        }).then(resolve)
      })
    }),
    ).then(resolve)
  })
}
