/**
 * TEST-ONLY DATA (never imported by the app): reference command transcripts and plausible wrong attempts for the Git challenges.
 * No imports: the e2e runner loads this file under plain Node. `@write <file> "<json string>"` is the editor's save.
 */
export const gitSolutions: Record<string, { valid: string[]; wrong: string[] }> = {
  'git-01-first-repo': {
    valid: ['git init\ngit add notes.txt\ngit commit -m "Add robot arm notes"', 'git init\ngit add .\ngit commit -m "Add notes about the robot arm"'],
    wrong: ['git init\ngit add notes.txt', 'git init\ngit commit -m "Add robot arm notes"', 'git init\ngit add notes.txt\ngit commit -m "update"'],
  },
  'git-01-two-commits': {
    valid: ['git init\ngit add README.md\ngit commit -m "Add the project README"\ngit add todo.txt\ngit commit -m "Add the task list for next week"'],
    wrong: ['git init\ngit add .\ngit commit -m "Add the README and the task list"', 'git init\ngit add todo.txt\ngit commit -m "Add the task list"\ngit add README.md\ngit commit -m "Add the project README"', 'git init\ngit add README.md\ngit commit -m "stuff"\ngit add todo.txt\ngit commit -m "more"'],
  },
  'git-01-two-commits-b': {
    valid: ['git init\ngit add protocol.md\ngit commit -m "Add the growth protocol"\ngit add results.csv\ngit commit -m "Add the first day of results"'],
    wrong: ['git init\ngit add .\ngit commit -m "Add protocol and results"', 'git init\ngit add results.csv\ngit commit -m "Add the results"\ngit add protocol.md\ngit commit -m "Add the protocol"'],
  },
  'git-01-selective': {
    valid: ['git add alerts.cfg\ngit commit -m "Raise the alert limit to 80 to cut noise"', 'git commit -am "Raise the alert limit to reduce false alarms"'],
    wrong: ['git add .\ngit commit -m "Raise the alert limit to 80"', 'git add alerts.cfg', 'git add alerts.cfg\ngit commit -m "fix"', 'rm scratch.txt\ngit commit -am "Raise the alert limit to 80"'],
  },
  'git-01-selective-b': {
    valid: ['git add schedule.md\ngit commit -m "Correct the Monday room number"', 'git commit -am "Fix the room number for Monday lessons"'],
    wrong: ['git add .\ngit commit -m "Correct the Monday room number"', 'git add schedule.md', 'rm draft-quiz.md\ngit commit -am "Correct the Monday room number"'],
  },
  'git-02-undo-edit': {
    valid: ['git diff\ngit restore settings.cfg', 'git restore settings.cfg'],
    wrong: ['git diff', 'git add settings.cfg\ngit commit -m "Change the settings"', 'rm settings.cfg'],
  },
  'git-02-revert-bad': {
    valid: ['git log --oneline\ngit revert HEAD --no-edit', 'git show HEAD\ngit revert HEAD --no-edit'],
    wrong: ['git reset --hard HEAD~1', 'git revert HEAD~1 --no-edit', 'git log --oneline', 'echo "server = prod-1" > deploy.cfg\ngit commit -am "Restore the server"'],
  },
  'git-02-revert-bad-b': {
    valid: ['git log --oneline\ngit revert HEAD --no-edit'],
    wrong: ['git reset --hard HEAD~1', 'git revert HEAD~1 --no-edit', 'git log --oneline'],
  },
  'git-02-unstage': {
    valid: ['git restore --staged debug.log\ngit commit -m "Update the app to print v2"'],
    wrong: ['git commit -m "Update the app to print v2"', 'git restore --staged app.py\ngit commit -m "x"', 'git restore --staged debug.log'],
  },
  'git-03-feature-branch': {
    valid: ['git switch -c dark-mode\necho "feature: dark mode" >> app.txt\ngit commit -am "Add the dark mode feature line"\ngit switch main\ngit merge dark-mode\ngit branch -d dark-mode', 'git checkout -b dark-mode\necho "feature: dark mode" >> app.txt\ngit commit -am "Describe the dark mode feature"\ngit checkout main\ngit merge dark-mode\ngit branch -d dark-mode'],
    wrong: ['echo "feature: dark mode" >> app.txt\ngit commit -am "Add the dark mode feature line"', 'git switch -c dark-mode\necho "feature: dark mode" >> app.txt\ngit commit -am "Add the dark mode feature line"\ngit switch main', 'git switch -c dark-mode\necho "feature: dark mode" >> app.txt\ngit commit -am "Add the dark mode feature line"\ngit switch main\ngit merge dark-mode'],
  },
  'git-03-fix-branch': {
    valid: ['git switch -c fix-typo\necho "Devices receive updates overnight." > guide.md\ngit commit -am "Correct the spelling of receive"\ngit switch main\ngit merge fix-typo\ngit branch -d fix-typo'],
    wrong: ['echo "Devices receive updates overnight." > guide.md\ngit commit -am "Correct the spelling of receive"', 'git switch -c fix-typo\necho "Devices receive updates overnight." > guide.md\ngit commit -am "Correct the spelling of receive"\ngit switch main', 'git switch -c fix-typo\necho "Devices receive updates overnight." > guide.md\ngit commit -am "fix"\ngit switch main\ngit merge fix-typo\ngit branch -d fix-typo'],
  },
  'git-03-fix-branch-b': {
    valid: ['git switch -c safety-limit\necho "name = packing" > line.cfg\necho "limit = 60" >> line.cfg\ngit commit -am "Lower the conveyor speed limit to 60"\ngit switch main\ngit merge safety-limit\ngit branch -d safety-limit'],
    wrong: ['echo "name = packing" > line.cfg\necho "limit = 60" >> line.cfg\ngit commit -am "Lower the conveyor speed limit to 60"', 'git switch -c safety-limit\necho "name = packing" > line.cfg\necho "limit = 60" >> line.cfg\ngit commit -am "Lower the conveyor speed limit to 60"\ngit switch main\ngit merge safety-limit'],
  },
  'git-03-isolated': {
    valid: ['git switch -c new-method\necho "method: bootstrap" > analysis.txt\ngit commit -am "Try the bootstrap method"\ngit switch main'],
    wrong: ['echo "method: bootstrap" > analysis.txt\ngit commit -am "Try the bootstrap method"', 'git switch -c new-method\necho "method: bootstrap" > analysis.txt\ngit commit -am "Try the bootstrap method"', 'git switch -c new-method\necho "method: bootstrap" > analysis.txt\ngit commit -am "Try the bootstrap method"\ngit switch main\ngit merge new-method'],
  },
  'git-04-resolve-title': {
    valid: ['git merge editor\n@write title.txt "Annual Final Report\\n"\ngit add title.txt\ngit commit -m "Merge the editor branch and agree on the final title"'],
    wrong: ['git merge editor\ngit add title.txt\ngit commit -m "Merge the editor branch"', 'git merge editor\n@write title.txt "Annual Report\\n"\ngit add title.txt\ngit commit -m "Merge the editor branch"', 'git merge editor\ngit merge --abort', 'git merge editor\n@write title.txt "Annual Final Report\\n"'],
  },
  'git-04-resolve-config': {
    valid: ['git merge retry-fix\n@write service.cfg "name = api\\ntimeout = 45\\nretries = 5\\n"\ngit add service.cfg\ngit commit -m "Merge retry-fix: higher timeout and retries"'],
    wrong: ['git merge retry-fix\n@write service.cfg "name = api\\ntimeout = 30\\nretries = 5\\n"\ngit add service.cfg\ngit commit -m "Merge retry-fix with the old timeout"', 'git merge retry-fix\ngit add service.cfg\ngit commit -m "Merge retry-fix"', 'git merge retry-fix\n@write service.cfg "name = api\\ntimeout = 45\\nretries = 5\\n"'],
  },
  'git-04-resolve-config-b': {
    valid: ['git merge promo\n@write prices.txt "widget = 9\\nsale = true\\n"\ngit add prices.txt\ngit commit -m "Merge promo: lower price and sale flag"'],
    wrong: ['git merge promo\n@write prices.txt "widget = 12\\nsale = true\\n"\ngit add prices.txt\ngit commit -m "Merge promo but keep the high price"', 'git merge promo\ngit add prices.txt\ngit commit -m "Merge promo branch"'],
  },
  'git-04-abort': {
    valid: ['git merge risky\ngit status\ngit merge --abort'],
    wrong: ['git status', 'git merge risky', 'git merge risky\ngit reset --hard', 'git merge risky\n@write app.py "mode = \\"fast\\"\\n"\ngit add app.py\ngit commit -m "Merge risky"'],
  },
  'git-05-first-push': {
    valid: ['git remote -v\ngit push -u origin main'],
    wrong: ['git status', 'git remote -v', 'git push origin feature'],
  },
  'git-05-pull-before-push': {
    valid: ['git push origin main\ngit pull\ngit push origin main', 'git fetch\ngit merge origin/main\ngit push origin main'],
    wrong: ['git push origin main', 'git push --force origin main', 'git pull'],
  },
  'git-05-pull-before-push-b': {
    valid: ['git pull\ngit push origin main'],
    wrong: ['git push origin main', 'git push -f origin main', 'git fetch'],
  },
  'git-05-pull-request': {
    valid: ['git switch -c add-contributing\necho "How to contribute: open a pull request" > CONTRIBUTING.md\ngit add CONTRIBUTING.md\ngit commit -m "Add contribution guidelines"\ngit push -u origin add-contributing\ngh pr create --base main --title "Add contribution guidelines"\ngh pr review 1 --approve --body "Looks good"\ngh pr merge 1\ngit switch main\ngit pull'],
    wrong: ['echo "How to contribute" > CONTRIBUTING.md\ngit add CONTRIBUTING.md\ngit commit -m "Add contribution guidelines"\ngit push origin main', 'git switch -c add-contributing\necho "How to contribute" > CONTRIBUTING.md\ngit add CONTRIBUTING.md\ngit commit -m "Add contribution guidelines"\ngit push -u origin add-contributing\ngh pr create --base main --title "Add contribution guidelines"\ngh pr merge 1\ngit switch main\ngit pull', 'git switch -c add-contributing\necho "How to contribute" > CONTRIBUTING.md\ngit add CONTRIBUTING.md\ngit commit -m "Add contribution guidelines"\ngit push -u origin add-contributing\ngh pr create --base main --title "Add contribution guidelines"\ngh pr review 1 --approve\ngh pr merge 1'],
  },
  'git-06-detective': {
    valid: ['git log --oneline\ngit show HEAD~1\ngit revert HEAD~1 --no-edit'],
    wrong: ['git revert HEAD --no-edit', 'git reset --hard HEAD~2', 'git log --oneline'],
  },
  'git-06-detective-b': {
    valid: ['git log --oneline\ngit show HEAD~2\ngit revert HEAD~2 --no-edit'],
    wrong: ['git revert HEAD --no-edit', 'git reset --hard HEAD~3', 'git log --oneline'],
  },
  'git-06-release': {
    valid: ['git switch -c release-notes\necho "- faster start-up" > RELEASE_NOTES.md\necho "- new export button" >> RELEASE_NOTES.md\ngit add RELEASE_NOTES.md\ngit commit -m "Add release notes for version 1.1"\ngit push -u origin release-notes\ngh pr create --base main --title "Add release notes for 1.1"\ngh pr review 1 --approve\ngh pr merge 1\ngit switch main\ngit pull\ngit tag v1.1'],
    wrong: ['echo "- faster start-up" > RELEASE_NOTES.md\necho "- new export button" >> RELEASE_NOTES.md\ngit add RELEASE_NOTES.md\ngit commit -m "Add release notes for version 1.1"\ngit push origin main\ngit tag v1.1', 'git switch -c release-notes\necho "- faster start-up" > RELEASE_NOTES.md\necho "- new export button" >> RELEASE_NOTES.md\ngit add RELEASE_NOTES.md\ngit commit -m "Add release notes for version 1.1"\ngit push -u origin release-notes\ngh pr create --base main --title "Add release notes for 1.1"\ngh pr merge 1\ngit switch main\ngit pull\ngit tag v1.1', 'git switch -c release-notes\necho "- faster start-up" > RELEASE_NOTES.md\necho "- new export button" >> RELEASE_NOTES.md\ngit add RELEASE_NOTES.md\ngit commit -m "Add release notes for version 1.1"\ngit push -u origin release-notes\ngh pr create --base main --title "Add release notes for 1.1"\ngh pr review 1 --approve\ngh pr merge 1\ngit switch main\ngit pull'],
  },
  'git-06-release-b': {
    valid: ['git switch -c protocol-update\necho "- sterilise tools before each run" > CHANGES.md\necho "- record room temperature" >> CHANGES.md\ngit add CHANGES.md\ngit commit -m "Describe the protocol changes for 2.3"\ngit push -u origin protocol-update\ngh pr create --base main --title "Protocol changes for 2.3"\ngh pr review 1 --approve\ngh pr merge 1\ngit switch main\ngit pull\ngit tag v2.3'],
    wrong: ['echo "- sterilise tools before each run" > CHANGES.md\necho "- record room temperature" >> CHANGES.md\ngit add CHANGES.md\ngit commit -m "Describe the protocol changes for 2.3"\ngit push origin main\ngit tag v2.3', 'git switch -c protocol-update\necho "- sterilise tools before each run" > CHANGES.md\necho "- record room temperature" >> CHANGES.md\ngit add CHANGES.md\ngit commit -m "Describe the protocol changes for 2.3"\ngit push -u origin protocol-update\ngh pr create --base main --title "Protocol changes for 2.3"\ngh pr review 1 --approve\ngh pr merge 1\ngit switch main\ngit pull'],
  },
};
