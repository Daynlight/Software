import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  collectCoverageFrom: [
    'app/(public)/login/page.tsx',
    'app/(app)/dashboard/page.tsx',
    'app/(app)/dashboard/profile/page.tsx',
    'app/components/LoginError.tsx',
    'app/components/ProfileEditor.tsx',
    'app/components/ProfileForm.tsx',
    'app/components/SessionStatus.tsx',
    'app/components/UserPhoto.tsx',
    'app/lib/session-client.ts',
    'app/lib/use-session-user.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
}

export default createJestConfig(config)
