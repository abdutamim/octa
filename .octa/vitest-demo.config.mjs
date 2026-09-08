import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['.octa/spec011-demo.test.ts']
  }
})
