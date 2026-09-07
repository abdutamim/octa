import { defineConfig } from 'vitest/config'
import ts from 'typescript'

const typescriptPlugin = {
  name: 'octa-typescript',
  enforce: 'pre',
  transform(code, id) {
    if (!/\.[cm]?[jt]sx?$/.test(id) || id.includes('/node_modules/')) return null
    const result = ts.transpileModule(code, {
      fileName: id,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.ReactJSX,
        sourceMap: true
      }
    })
    return { code: result.outputText, map: result.sourceMapText ?? null }
  }
}

export default defineConfig({
  esbuild: false,
  plugins: [typescriptPlugin],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts']
  }
})
