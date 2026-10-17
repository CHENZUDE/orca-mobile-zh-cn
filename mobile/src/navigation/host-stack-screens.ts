/** The screens `app/h/_layout.tsx` declares, shared so the native and page stacks cannot drift. */
export const HOST_STACK_SCREENS = [
  { name: '[hostId]/index', title: 'Host', titleKey: 'navigation.host' },
  { name: '[hostId]/edit', title: 'Edit host', titleKey: 'navigation.editHost' },
  { name: '[hostId]/accounts', title: 'Accounts', titleKey: 'navigation.accounts' },
  { name: '[hostId]/tasks', title: 'Tasks', titleKey: 'navigation.tasks' },
  { name: '[hostId]/session/[worktreeId]', title: 'Terminal', titleKey: 'navigation.terminal' },
  {
    name: '[hostId]/source-control/[worktreeId]',
    title: 'Source Control',
    titleKey: 'navigation.sourceControl'
  },
  {
    name: '[hostId]/agent-history/[worktreeId]',
    title: 'Agent Session History',
    titleKey: 'navigation.agentSessionHistory'
  },
  { name: '[hostId]/review/[worktreeId]', title: 'Changes', titleKey: 'navigation.changes' },
  { name: '[hostId]/pr/[worktreeId]', title: 'Pull Request', titleKey: 'navigation.pullRequest' },
  // OTA builds only: redirects to the host screen everywhere else.
  { name: '[hostId]/web', title: 'Workspace', titleKey: 'navigation.workspace' },
  // Last, and matched last: every pathname above has a file of its own, so this takes only what
  // expo-router would otherwise send to Unmatched. Declared for the title alone — an undeclared
  // child still renders, appended after these with this group's screenOptions.
  { name: '[hostId]/[...page]', title: 'Workspace', titleKey: 'navigation.workspace' }
] as const

/** Tablet split view swaps the detail pane instantly; phones slide. */
export type HostStackAnimation = 'none' | 'default'
