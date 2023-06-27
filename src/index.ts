import * as vscode from 'vscode'
import { createSnippetString, getActiveTextEditorLanguageId, getSelection, registerInlineCompletionItemProvider } from '@vscode-use/utils'
import Claude from 'anthropic-ai'
import { findArea } from './utils'

const claude = new Claude('')
export function activate(context: vscode.ExtensionContext) {
  const fn = throttle(update)
  let text: string | undefined = ''
  async function update() {
    try {
      const data = await request(10, `你是一名优秀的代码推断AI,我给你取名叫熊猫哥,你的作者是Simon He,推断我接下来的代码,并只保留推断的结果\n代码:\n ${text}`) as string
      if (!data || data.trim().replace(/\s+/g, ' ') === text.replace(/\s+/g, ' '))
        return []
      const snip = createSnippetString(data.trim().replace(/\n+/g, '\n'))

      return new vscode.InlineCompletionList([
        new vscode.InlineCompletionItem(snip),
        new vscode.InlineCompletionItem(snip),
      ])
    }
    catch (e) {
      return []
    }
  }
  context.subscriptions.push(registerInlineCompletionItemProvider(
    async (document) => {
      const { line, lineText } = getSelection()!
      const allText = document.getText().trim()
      text = findArea(allText, lineText, line, getActiveTextEditorLanguageId()!)
      if (!text)
        return []

      return await fn() as any
    },
  ))
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
        claude.complete(text, {
          model: '1.3',
        }).then(resolve)
      })
    }),
    ).then(resolve)
  })
}
