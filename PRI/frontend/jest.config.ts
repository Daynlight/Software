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
    'app/(app)/gielda/page.tsx',
    'app/(app)/gielda/nowa/page.tsx',
    'app/(app)/moja-grupa/page.tsx',
    'app/(app)/zgloszenia/page.tsx',
    'app/components/LoginError.tsx',
    'app/components/ProfileEditor.tsx',
    'app/components/ProfileForm.tsx',
    'app/components/SessionStatus.tsx',
    'app/components/UserPhoto.tsx',
    'app/components/groups/CreateGroupForm.tsx',
    'app/components/groups/GroupBoardRow.tsx',
    'app/components/groups/GroupFilters.tsx',
    'app/components/groups/GroupEditForm.tsx',
    'app/components/groups/GroupJoinAction.tsx',
    'app/components/groups/GroupMembers.tsx',
    'app/components/groups/LeaveGroupButton.tsx',
    'app/components/groups/JoinRequestInbox.tsx',
    'app/lib/group-validation.ts',
    'app/lib/groups-client.ts',
    'app/lib/session-client.ts',
    'app/lib/use-my-group.ts',
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
