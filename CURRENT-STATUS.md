# Website current status

State: test site working; production promotion prepared as part of DevCapsule's
`website` workstream. Branch: `production-pages`. Delivery: owner merges PR to `main`.
Independent future development: `single-stream`; transition not yet performed.

## Current result

Eleventy renders the parent README, guides and development blog. The custom
responsive presentation, navigation, code highlighting/copying, local preview,
source-link conversion and build identities are implemented. Content stays in
DevCapsule. The owner reports the test deployment works well; HTTPS and its
manifest were independently checked on 2026-09-17. Initial website and parent
PRs are merged. Production publication remains an owner action.

The parent owns the current experiment budget and interruption arrangements.
SSH clone/push is the delivery path; GitHub app access is unavailable. The owner
accepts local execution of build/trigger scripts and will handle backend wiring
at delivery. See [PUBLISHING.md](PUBLISHING.md).

## Validation

Build and all 582 local links/anchors/assets pass across 16 HTML pages. Four
focused routing/rendering tests pass. Chromium audits of six representative
pages at 1440px and 390px pass with zero automated WCAG A/AA violations, no page
overflow, and no JavaScript errors. Keyboard skip/anchor navigation and no-JS
navigation pass. Additional 320px reflow and exact clipboard checks pass.
Desktop and mobile screenshots were visually inspected. Evidence is in ignored
`.artifacts/` for this checkout; regenerate it with the browser-check script.

The clean standalone clone acceptance passed: npm ci/build, paragraph update,
independent styling update with unchanged content digest, subdirectory links,
and production canonical/robots metadata. Parent submodules were not initialized.
The parent DevCapsule Nox build gate also passed; no backend source changed.
The manifest and Linux lock were generated/validated using DevCapsule's current
resolver; a separate capsule launch has not been performed.

## Production promotion slice (2026-09-17)

The owner requested a publishing action here for `devcapsule.mycodespace.ai`.
Only `mycodespace.ai` is owned; other domain spellings in conversation were typos.
The owner selected public GitHub Release assets to avoid personal tokens and
credential renewal. The parent test workflow now publishes a prerelease candidate
only after successful test deployment, using its built-in GITHUB_TOKEN. Candidate
tags are `website-candidate-RUN_ID-ATTEMPT`, and do not become the latest CLI
release. The website production workflow downloads candidate.json and the tar.gz
anonymously, validates the checksum, safe archive paths, source revisions and
metadata, then changes canonical origins and adds promotion provenance.
It does not rebuild tested content/assets. No CANDIDATE_READ_TOKEN is used.
Release assets remain available until deleted; Actions retention no longer limits
promotion/rollback. Downloads trust the repository's published release assets;
no enforced immutable-release setting is claimed.

Eleven unit tests pass, including anonymous-download behavior, archive corruption
and unsafe-path rejection, byte preservation and invalid candidate metadata.
A clean build of the deployed source revisions passed packaging, simulated
anonymous asset download, promotion and all 582 local links across 16 pages.
Both workflows pass actionlint 1.7.12. No visual changes were made, so browser
audits were not repeated. Hosted release
creation and production deployment remain unverified until owner merges and runs
the workflows. Local validation does not publish a release or deploy a site.

The required parent `nox -s build` gate passed again, including all nine
packaging integration checks. Its dirty-tree policy skipped the public revision
PEX; the local PEX build and smoke checks passed.

## Next step

Merge website `production-pages`, then parent `website/initial-cut` with the new
website pin and test workflow. If the website PR is squash-merged, update the
parent pin to its merged revision first. Follow [PUBLISHING.md](PUBLISHING.md)
for production Pages/DNS/HTTPS and manual publishing; no new secret is needed.
Start a new parent Website run from updated main (production mode, test origin,
root base path); review the test site, then use its candidate tag in this repo's
Publish production website action. Old run `35187865183` has no release assets;
rerunning it uses the old workflow and does not create candidates.
Do not dispatch production on the owner's behalf during this delivery.

## Open threads

- Owner handles both PR merges, production Pages/DNS/TLS and initial dispatches.
- The current test deployment allows indexing because the parent workflow uses
  production mode to publish; separate noindex support is outside this slice.
- Formal autonomy-experiment acceptance/finalization remains with the owner.
- Full graphical launch of this project's own capsule remains untested; Node-based
  standalone preview is the practical acceptance path for this cut.
- No separate content copy, database, cloud account, or full chat record is preserved.
