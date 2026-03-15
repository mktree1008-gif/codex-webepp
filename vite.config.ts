import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const pagesBasePath =
  process.env.GITHUB_ACTIONS === 'true' && repositoryName
    ? `/${repositoryName}/`
    : '/'

export default defineConfig({
  base: pagesBasePath,
  plugins: [react()],
  build: {
    target: ['es2018', 'safari13'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
