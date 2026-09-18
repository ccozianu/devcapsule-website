# Build and publication

DevCapsule builds and publishes the test site. Its `scripts/website.sh` invokes
this project's build using the parent content checkout and pinned website Git
revision. This repository promotes a reviewed test artifact to production.
Changing documentation needs no edit or commit in the presentation repository.
Changing presentation requires a commit here; DevCapsule then advances its
submodule pointer when it wants to publish that revision.

## Local update mechanism

From DevCapsule, `./scripts/website.sh preview` watches content and presentation.
A saved paragraph edit rebuilds the preview. `./scripts/website.sh build` makes
and checks a fresh output on demand. This is also the build step used by the
prepared GitHub Actions workflow. `_site/` is generated; never edit it manually.

Defaults are deliberately a preview: no canonical production URL and robots
`noindex, nofollow`. To build for a custom-domain production site:

```sh
SITE_MODE=production SITE_ORIGIN=https://devcapsule.mycodespace.ai \
  SITE_BASE_PATH=/ ./scripts/website.sh build
```

The command above is run from DevCapsule. In this standalone project replace
`./scripts/website.sh build` with `npm run build && npm run check`, exporting the
same environment variables for both commands. `SITE_BASE_PATH` must have leading
and trailing slashes. For a GitHub project URL, use `/devcapsule/`; for a custom
domain use `/`. `SITE_ORIGIN` is only the HTTPS origin, without a path or trailing
slash. Production builds require it. To return to local preview, unset the
production variables and run the preview command again.

## Test site and public candidates: DevCapsule repository

The parent publishes `test-devcapsule.mycodespace.ai`. Its manual
**Actions → Website → Run workflow** uses branch `main`, mode `production`,
origin `https://test-devcapsule.mycodespace.ai`, and base path `/`. The current
`production` label means a public Pages deployment; `preview` only uploads an
artifact. The test site's production-mode build currently allows indexing.
Separate test-site noindex support is outside this publishing change.

After the test deployment succeeds, the `candidate` job packages the same saved
build into a public GitHub prerelease named `website-candidate-RUN_ID-ATTEMPT`.
It uploads `website.tar.gz` and `candidate.json` (source revisions, source run
and attempt, and the archive SHA-256). A draft becomes public only after both
assets upload. The workflow summary links to the candidate release.

Website candidates use their own tag prefix and `latest=false`; they do not
replace the latest CLI release or trigger the `v*` CLI release workflow.
Each attempt gets a new tag; the workflow does not overwrite prior candidates.
The release job alone gets `contents: write`, through GitHub's automatically
issued `GITHUB_TOKEN`. There is no personal token to create, store or renew.

Review the test deployment and record its candidate tag. Content and styling
changes reach the test site through the parent content commit and website pin.
The release retains that tested output even after the test site moves forward.

## Production site: this repository

[`.github/workflows/publish.yml`](.github/workflows/publish.yml) provides
**Publish production website**. Run it manually on `main` and enter the reviewed
candidate release tag. It downloads the two public release assets anonymously,
checks the archive SHA-256 and source metadata, rejects unsafe archive paths or
links, and checks the resulting site's local links before deploying.

Promotion changes only HTML canonical origins from the test hostname to
`https://devcapsule.mycodespace.ai` and adds release/run/checksum provenance to
`build-info.json`. It does not rebuild content, styles, scripts or images. The visible footer
build time and `builtAt` in `build-info.json` remain the original candidate
build time, including on rollback. Candidates created before this field was
introduced remain promotable but do not gain a timestamp retroactively.
The source must be a clean production-mode build at `/` with the test site's
canonical origin. The publishing workflow is trusted to create candidates only
after successful test deployment. Promotion reads the retained release, so it
does not depend on Actions logs or artifacts still being available.

### One-time owner setup

1. Merge website `production-pages` into this repository's `main`, then merge
   DevCapsule `website/initial-cut`, which includes the updated test workflow
   and website submodule pin. With a squash merge, select the merged website
   revision in the parent before merging it. The owner creates/merges PRs;
   SSH delivery does not require GitHub app access.
2. In **ccozianu/devcapsule-website → Settings → Pages**, select source
   **GitHub Actions**. Skip suggested workflow templates; our workflow exists.
3. Set the custom domain to **devcapsule.mycodespace.ai**. Create DNS
   **CNAME `devcapsule` → `ccozianu.github.io`** in the `mycodespace.ai` zone.
   Keep the parent's test domain and CNAME. Enable **Enforce HTTPS** after
   GitHub provisions the production certificate.
4. In **Settings → Environments → github-pages**, restrict deployment to `main`.
   A review gate is optional; if enabled, its self-review policy must permit
   the owner's intended solo workflow. The workflow already requires manual
   dispatch and only prepares deployments from `main`.

No repository secret or personal token is required. If you created
`CANDIDATE_READ_TOKEN` for the earlier proposal, it is unused by these workflows
and may be deleted; its personal token can also be revoked if unused elsewhere.

### Publish or roll back

1. Run the updated parent **Website** workflow on `main` with the test-domain
   settings above. Wait for `build`, `deploy` and `candidate` to succeed.
2. Review the test site. Copy the **candidate tag** from the run summary or
   [DevCapsule releases](https://github.com/ccozianu/devcapsule/releases).
3. In this repository, run **Publish production website** on `main` with that
   tag. Approve an environment gate if configured. Wait for `prepare` and
   `deploy` to succeed.
4. Check production HTTPS, navigation and `/build-info.json`. The original
   source revisions remain; `promotion` records the source release, run,
   attempt, archive checksum and production origin.

The old test run `35187865183` predates release publication. Start a **new run
from updated main**; rerunning that old run executes its old workflow definition
and cannot create a release candidate.

To roll back, select an older candidate tag in the same production action.
Release assets have no Actions artifact expiration schedule; keep candidate
releases and their assets for as long as rollback is needed. Repository owners
can still delete or modify releases, so these are retained candidates, not a
claim of enforced immutable storage. Missing assets or checksum failures stop
promotion before deployment. Failed preparation leaves existing production up.

Content merges, CLI releases and website merges do not automatically publish.
Production promotion does not change the test deployment. The seven-day Actions
artifact remains a temporary bridge between jobs in the test workflow; it is
no longer the production download or rollback source.

Packaging and extraction use Node 22 and GNU tar on the Ubuntu Actions runner.
The archive itself is ordinary static output, usable on other static hosts.
GitHub CLI is used only by the hosted release job; local development needs no
GitHub credentials. The standalone repository does not dispatch parent workflows
or write authored content into DevCapsule.

GitHub references: [Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages),
[public release assets](https://docs.github.com/en/rest/releases/assets#get-a-release-asset),
[creating releases](https://cli.github.com/manual/gh_release_create),
[custom domains and HTTPS](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
