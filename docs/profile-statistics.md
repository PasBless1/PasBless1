# Automatic profile statistics

This review changes freshness, not the approved banner, wording or card palette.
The README keeps the existing hosted images until the first successful run on
`main`. That run commits three locally generated SVGs and their README references
together, so no missing images are published during setup.

Once approved and merged, the workflow attempts a refresh every 15 minutes
(minutes 7, 22, 37 and 52), on human pushes to `main`, and through the Actions
**Run workflow** button. It fetches public data directly from GitHub with the
repository's built-in `GITHUB_TOKEN`; no personal token or new hosting is needed.
It updates current-year stats, last-year commits and languages. Calendar years
roll over automatically using Europe/Berlin.

Each changed SVG receives a new content-versioned image URL. Unchanged cards do
not cause commits. Automated refresh commits use `github-actions[bot]`, not
Blessing's identity. API failures leave the last successful cards in place.
Only the marked GitHub activity section and the three generated cards can be
published by this workflow. It does not publish any unapproved banner branch.

This is automatic, near-live updating, not second-by-second realtime. GitHub's
API and image delivery can lag, and scheduled Actions can be delayed or dropped.
Public-repository schedules can be disabled after 60 days without repository
activity. Leaving a profile page open will not animate or reload the cards;
refresh the page to see the latest available version.

## Verification and activation

1. Review the draft PR. Do not merge until approved.
2. After merging, confirm **Refresh profile statistics** completes successfully
   and creates the three SVGs in `assets/github-activity/`.
3. Confirm the README now references those local SVGs with `?v=` versions, both
   commit years are correct, and the banner/prose are unchanged.
4. If Actions is disabled or repository rules block bot pushes, enable Actions
   or allow the workflow under the existing repository policy; do not bypass
   protection rules. Failed runs remain visible in Actions.

Local tests: `node --test scripts/profile-stats.test.mjs`.

Sources:

- [Official stats action](https://github.com/stats-organization/github-readme-stats-action)
- [Provider's self-run documentation](https://github.com/stats-organization/github-stats-extended/blob/master/apps/frontend/src/content/docs/docs/deploy.md)
- [GitHub schedule limitations](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
- [GitHub image caching](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-anonymized-urls)
