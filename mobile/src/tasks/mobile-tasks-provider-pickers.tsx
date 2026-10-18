import { translate } from '../i18n/i18n'
import type { ConnectionPresentationModel } from './use-mobile-tasks-connection-presentation'
import {
  PickerModal,
  BottomDrawer,
  View,
  Text,
  Pressable,
  Check,
  colors,
  ScrollView
} from './mobile-tasks-dependencies'
import {
  normalizeGitHubPreset,
  getTaskPresetQuery,
  githubKindFromQuery,
  scopeGitHubTaskSearch,
  normalizeLinearFilter,
  repositoryCount,
  getRepoBadgeColor,
  getTaskRepoDetail,
  issueSourceSlug,
  GITHUB_KIND_OPTIONS
} from './mobile-tasks-legacy-foundation'
import { styles } from './mobile-tasks-legacy-styles'
import { normalizeJiraFilter } from './mobile-jira-issue-filters'

export function renderMobileTasksProviderPicker(model: ConnectionPresentationModel) {
  const {
    githubPreset,
    persistTaskSource,
    provider,
    providerOptions,
    setAppliedQuery,
    setGithubKind,
    setGithubMode,
    setGithubPreset,
    setItems,
    setLinearFilter,
    setJiraFilter,
    setProvider,
    setQuery,
    setShowProviderPicker,
    showProviderPicker,
    taskResumeRef,
    taskUiReady
  } = model
  const t = translate
  return (
    <PickerModal
      visible={taskUiReady && showProviderPicker}
      title={t('tasks.providerPickers.taskSource')}
      options={providerOptions}
      selected={provider}
      onSelect={(next) => {
        const resume = taskResumeRef.current
        persistTaskSource(next)
        setProvider(next)
        setItems([])
        if (next === 'github') {
          const nextMode = resume.githubMode === 'project' ? 'project' : 'items'
          setGithubMode(nextMode)
          if (nextMode === 'project') {
            setQuery('')
            setAppliedQuery('')
            return
          }
          const preset =
            resume.githubItemsPreset === null
              ? githubPreset
              : normalizeGitHubPreset(resume.githubItemsPreset ?? githubPreset)
          const nextQuery =
            resume.githubItemsPreset === null
              ? (resume.githubItemsQuery ?? '')
              : getTaskPresetQuery(preset)
          const nextKind = githubKindFromQuery(nextQuery, preset)
          setGithubPreset(preset)
          setGithubKind(nextKind)
          setQuery(nextQuery)
          setAppliedQuery(scopeGitHubTaskSearch(nextQuery, nextKind))
        } else if (next === 'linear') {
          const nextQuery = resume.linearQuery ?? ''
          setLinearFilter(normalizeLinearFilter(resume.linearPreset))
          setQuery(nextQuery)
          setAppliedQuery(nextQuery.trim())
        } else if (next === 'jira') {
          const nextQuery = resume.jiraQuery ?? ''
          setJiraFilter(normalizeJiraFilter(resume.jiraPreset))
          setQuery(nextQuery)
          setAppliedQuery(nextQuery.trim())
        } else {
          setQuery('')
          setAppliedQuery('')
        }
      }}
      onClose={() => setShowProviderPicker(false)}
    />
  )
}

export function renderMobileTasksRepoPicker(model: ConnectionPresentationModel) {
  const {
    hostedRepos,
    persistRepoSelection,
    effectiveRepoIds,
    repoHostLabels,
    setSelectedRepoIds,
    setShowRepoPicker,
    showRepoPicker,
    taskUiReady,
    toggleRepoSelection
  } = model
  const t = translate
  return (
    <BottomDrawer visible={taskUiReady && showRepoPicker} onClose={() => setShowRepoPicker(false)}>
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>{t('tasks.providerPickers.repositories')}</Text>
        <Text style={styles.sheetSubtitle}>{t('tasks.providerPickers.repositoriesSubtitle')}</Text>
      </View>

      <View style={styles.repoPickerGroup}>
        <Pressable
          style={styles.repoPickerRow}
          onPress={() => {
            const allSelection = new Set<string>()
            setSelectedRepoIds(allSelection)
            persistRepoSelection(allSelection, hostedRepos)
          }}
        >
          <View style={styles.repoPickerTextWrap}>
            <Text style={styles.repoPickerTitle}>{t('tasks.providerPickers.allRepositories')}</Text>
            <Text style={styles.repoPickerSubtitle}>{repositoryCount(hostedRepos.length)}</Text>
          </View>
          {effectiveRepoIds.size === 0 ? <Check size={15} color={colors.textPrimary} /> : null}
        </Pressable>

        {hostedRepos.map((repo) => {
          const selected = effectiveRepoIds.has(repo.id)
          return (
            <View key={repo.id}>
              <View style={styles.actionSeparator} />
              <Pressable style={styles.repoPickerRow} onPress={() => toggleRepoSelection(repo.id)}>
                <View
                  style={[
                    styles.pickerRepoDot,
                    { backgroundColor: getRepoBadgeColor(repo, repo.displayName) }
                  ]}
                />
                <View style={styles.repoPickerTextWrap}>
                  <Text style={styles.repoPickerTitle} numberOfLines={1}>
                    {repo.displayName}
                  </Text>
                  <Text style={styles.repoPickerSubtitle} numberOfLines={1}>
                    {getTaskRepoDetail(repo, repoHostLabels)}
                  </Text>
                </View>
                {selected ? <Check size={15} color={colors.textPrimary} /> : null}
              </Pressable>
            </View>
          )
        })}
      </View>
    </BottomDrawer>
  )
}

export function renderMobileTasksGitHubIssueSourcePicker(model: ConnectionPresentationModel) {
  const {
    githubIssueSourceRows,
    setGitHubIssueSourcePreference,
    setShowGitHubIssueSourcePicker,
    showGitHubIssueSourcePicker,
    taskUiReady
  } = model
  const t = translate
  return (
    <BottomDrawer
      visible={taskUiReady && showGitHubIssueSourcePicker}
      onClose={() => setShowGitHubIssueSourcePicker(false)}
    >
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>{t('tasks.providerPickers.issueSources')}</Text>
        <Text style={styles.sheetSubtitle}>
          {t('tasks.providerPickers.issueSourcesSubtitle')}
        </Text>
      </View>

      <View style={styles.repoPickerGroup}>
        {githubIssueSourceRows.length === 0 ? (
          <View style={styles.drawerLoadingRow}>
            <Text style={styles.detailMuted}>{t('tasks.providerPickers.noAlternateSources')}</Text>
          </View>
        ) : (
          githubIssueSourceRows.map(({ repo, sources }, index) => {
            const selectedPreference =
              repo.issueSourcePreference === 'origin' || repo.issueSourcePreference === 'upstream'
                ? repo.issueSourcePreference
                : 'upstream'
            return (
              <View key={repo.id}>
                {index > 0 ? <View style={styles.actionSeparator} /> : null}
                <View style={styles.issueSourceBox}>
                  <View style={styles.repoPickerTextWrap}>
                    <Text style={styles.repoPickerTitle} numberOfLines={1}>
                      {repo.displayName}
                    </Text>
                    <Text style={styles.issueSourceHint} numberOfLines={2}>
                      {t('tasks.providerPickers.querying')}{' '}
                      {issueSourceSlug(
                        selectedPreference === 'origin' ? sources.prs : sources.upstreamCandidate
                      )}
                    </Text>
                  </View>
                  <View style={styles.issueSourceSegment}>
                    {(['upstream', 'origin'] as const).map((preference) => {
                      const selected = selectedPreference === preference
                      const slug =
                        preference === 'upstream'
                          ? issueSourceSlug(sources.upstreamCandidate)
                          : issueSourceSlug(sources.prs)
                      return (
                        <Pressable
                          key={preference}
                          style={[
                            styles.issueSourceSegmentButton,
                            selected && styles.issueSourceSegmentButtonActive
                          ]}
                          accessibilityState={{ selected }}
                          onPress={() => void setGitHubIssueSourcePreference(repo, preference)}
                        >
                          <Text
                            style={[
                              styles.issueSourceSegmentText,
                              selected && styles.issueSourceSegmentTextActive
                            ]}
                          >
                            {preference === 'upstream'
                              ? t('tasks.create.upstream')
                              : t('tasks.create.origin')}
                          </Text>
                          <Text style={styles.issueSourceSlug} numberOfLines={1}>
                            {slug}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                </View>
              </View>
            )
          })
        )}
      </View>
    </BottomDrawer>
  )
}

export function renderMobileTasksGitHubViewPicker(model: ConnectionPresentationModel) {
  const {
    githubKind,
    githubMode,
    persistTaskResumeState,
    setAppliedQuery,
    setGithubKind,
    setGithubMode,
    setGithubPreset,
    setItems,
    setQuery,
    setShowGitHubKindPicker,
    showGitHubKindPicker,
    taskUiReady
  } = model
  const t = translate
  return (
    <PickerModal
      visible={taskUiReady && showGitHubKindPicker}
      title={t('tasks.providerPickers.githubView')}
      options={GITHUB_KIND_OPTIONS}
      selected={githubMode === 'project' ? 'project' : githubKind}
      onSelect={(kind) => {
        if (kind === 'project') {
          setGithubMode('project')
          setItems([])
          persistTaskResumeState({ githubMode: 'project' })
          return
        }
        const preset = kind === 'prs' ? 'prs' : 'issues'
        const nextQuery = getTaskPresetQuery(preset)
        setGithubMode('items')
        setGithubKind(kind)
        setGithubPreset(preset)
        setQuery(nextQuery)
        setAppliedQuery(nextQuery)
        persistTaskResumeState({
          githubMode: 'items',
          githubItemsPreset: preset,
          githubItemsQuery: nextQuery
        })
      }}
      onClose={() => setShowGitHubKindPicker(false)}
    />
  )
}

export function renderMobileTasksGitHubPresetPicker(model: ConnectionPresentationModel) {
  const {
    githubKind,
    githubPreset,
    githubPresetPickerOptions,
    persistDefaultGitHubPreset,
    persistTaskResumeState,
    setAppliedQuery,
    setGithubKind,
    setGithubMode,
    setGithubPreset,
    setQuery,
    setShowGitHubPresetPicker,
    showGitHubPresetPicker,
    taskUiReady
  } = model
  const t = translate
  return (
    <PickerModal
      visible={taskUiReady && showGitHubPresetPicker}
      title={
        githubKind === 'prs'
          ? t('tasks.providerPickers.pullRequests')
          : t('tasks.providerPickers.issues')
      }
      options={githubPresetPickerOptions}
      selected={githubPreset}
      onSelect={(preset) => {
        const nextQuery = getTaskPresetQuery(preset)
        setGithubMode('items')
        setGithubKind(preset === 'issues' || preset === 'my-issues' ? 'issues' : 'prs')
        setGithubPreset(preset)
        setQuery(nextQuery)
        setAppliedQuery(nextQuery)
        persistTaskResumeState({
          githubItemsPreset: preset,
          githubItemsQuery: nextQuery
        })
      }}
      onLongSelect={persistDefaultGitHubPreset}
      onClose={() => setShowGitHubPresetPicker(false)}
    />
  )
}

export function renderMobileTasksPagePicker(model: ConnectionPresentationModel) {
  const {
    githubCurrentPage,
    githubPagePickerPages,
    githubPages,
    githubPaginationLoading,
    handleGitHubPageChange,
    setShowGitHubPagePicker,
    showGitHubPagePicker,
    taskUiReady
  } = model
  const t = translate
  return (
    <BottomDrawer
      visible={taskUiReady && showGitHubPagePicker}
      onClose={() => setShowGitHubPagePicker(false)}
    >
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>{t('tasks.providerPickers.githubPages')}</Text>
        <Text style={styles.sheetSubtitle}>{t('tasks.providerPickers.githubPagesSubtitle')}</Text>
      </View>
      <ScrollView style={styles.pagePickerList}>
        {githubPagePickerPages.map((index) => {
          const selected = index === githubCurrentPage
          const loaded = index < githubPages.length
          return (
            <Pressable
              key={`github-page:${index}`}
              style={[styles.pickerRow, selected && styles.pickerRowSelected]}
              disabled={githubPaginationLoading}
              onPress={() => {
                setShowGitHubPagePicker(false)
                void handleGitHubPageChange(index)
              }}
            >
              <View style={styles.pickerRowContent}>
                <Text style={styles.pickerRowLabel}>
                  {t('tasks.providerPickers.page', { page: index + 1 })}
                </Text>
                <Text style={styles.pickerRowSubtitle}>
                  {loaded ? t('tasks.providerPickers.loaded') : t('tasks.providerPickers.loadsOlder')}
                </Text>
              </View>
              {selected ? <Check size={16} color={colors.textPrimary} /> : null}
            </Pressable>
          )
        })}
      </ScrollView>
    </BottomDrawer>
  )
}
