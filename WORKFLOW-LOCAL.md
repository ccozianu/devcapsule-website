# Local Workflow: DevCapsule Website

This is the project's own half of the workflow. `WORKFLOW.md` beside it is the
installed generic definition and binds wherever it speaks; this file governs
wherever it is silent. See *The Project's Local Workflow* in `WORKFLOW.md`.
The definition was installed on 2026-09-22 at version 0.2.14, from the parent
DevCapsule checkout at the owner's instruction, after this project had run
for a week on its own single-stream handoff without one.

## Integration Branch

`main`, as the definition assumes.

## Version Scheme

The website carries no release version. `package.json` says `0.1.0` and is
private; nothing publishes it. The identity of a deployed site is the pair of
Git revisions in `build-info.json`: the DevCapsule content revision and this
repository's implementation revision. There is no bump command.

## Release Policy

This project has no `release-<version>` branches and no `v<version>` tags.
Publication replaces releases and is described in [PUBLISHING.md](PUBLISHING.md):

- DevCapsule's **Website** workflow builds `main` content with the pinned
  website revision, deploys the test site, and records the exact output as a
  public prerelease `website-candidate-<run>-<attempt>` in the DevCapsule
  repository. Those tags belong to DevCapsule, not to this repository.
- This repository's **Publish production website** workflow promotes one
  reviewed candidate to `devcapsule.mycodespace.ai` without rebuilding.
- Acceptance evidence is the owner's review of the test site; record the
  promoted candidate tag and what was checked in `CURRENT-STATUS.md`.
- A presentation change reaches the public site only after it is merged here
  and DevCapsule advances its submodule pin; that pin bump is DevCapsule's
  integration, not this project's.

No production publication happens without the owner's explicit acceptance.

## Validation Commands

Before a checkpoint: `npm test`, `npm run build`, `npm run check`. For layout
or interaction changes also inspect desktop and mobile screenshots and run
`npm run test:browser` against the running preview. For changes to content
consumption run `npm run test:updates` on a clean standalone clone. The full
description is in [README.md](README.md#validate) and [DEVELOPING.md](DEVELOPING.md).

## Host Capabilities

- Node 22 or newer and Git; Playwright Chromium only for browser checks.
- GitHub Pages on this repository: source GitHub Actions, custom domain
  `devcapsule.mycodespace.ai`, environment `github-pages` restricted to `main`.
- Manual `workflow_dispatch` rights on both repositories, held by the owner.
  No personal token exists or is needed; the candidate job uses the built-in
  Actions token.
- Agents have SSH push access and no GitHub API or pull-request rights: push a
  branch, prepare the compare link, and the owner opens and merges the PR.
- The committed DevCapsule manifest recommends host networking so the host
  browser can reach the loopback preview; a developer may decline it.

## Content Boundary

Authored content lives in DevCapsule: its `README.md`, `docs/`, and
`engineering-docs/blog/`. This repository owns presentation, navigation,
rendering, and publishing machinery, and never keeps a second copy of authored
prose. The consumed interface is described under *Content contract* in
[README.md](README.md) as implemented today; its agreed producer-side
requirements are DevCapsule's
[R-DOCS-003](https://github.com/ccozianu/devcapsule/blob/e67f6faf5e2aba80e942b35bd9bf72bea26adb10/engineering-docs/requirements/product/r-docs-003-website-content-carries-front-matter.md),
to be recorded here as contract version 1 under W12 when implemented.

## Exceptions

- 2026-09-19: the owner authorized a one-time direct submodule edit from the
  parent to transfer the website backlog here. Ended with that handoff.
- 2026-09-22: the parent `user-docs` workstream delivered requests as a
  pointer commit appended to `CURRENT-STATUS.md`, because the two repositories
  share no mailbox and `devcapsule workflow mail` does not cross projects.
  Ends when the workflow provides cross-project delivery.
- Bug records under `engineering-docs/bugs/` use `owner: none`; this is a
  single-stream project and has no workstreams to route to.
- `CURRENT-STATUS.md` predates the installed definition and keeps its own
  section structure rather than the single-stream template's headings.
