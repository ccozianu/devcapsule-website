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

## Test site: DevCapsule repository

The parent repository publishes `test-devcapsule.mycodespace.ai`. Its manual
**Actions → Website → Run workflow** uses branch `main`, mode `production`,
origin `https://test-devcapsule.mycodespace.ai`, and base path `/`. In this
existing workflow, `production` means a public Pages deployment; `preview`
only uploads an artifact. The test site's current production-mode build allows
indexing. Separate test-site noindex support is not part of this change.

Content and styling changes reach the test site through the parent content
commit and its website submodule pin. Review that deployment before promoting.
Record the run ID from its URL, for example `35187865183` in
`https://github.com/ccozianu/devcapsule/actions/runs/35187865183`.
The small run number displayed beside the workflow title is not the run ID.

## Production site: this repository

[`.github/workflows/publish.yml`](.github/workflows/publish.yml) provides
**Publish production website**. It runs manually from `main` and promotes a
successful test deployment by run ID. It downloads the saved `website-preview`
artifact, verifies its digest and its two source revisions, changes only HTML
canonical origins from the test hostname to `https://devcapsule.mycodespace.ai`,
and records promotion provenance in `build-info.json`. It checks links before
uploading the result to this repository's Pages site. No content or assets are
rebuilt, and no code from the downloaded artifact is executed.

The source must be a successful manual parent `Website` run on `main`, including
a successful `deploy` job. Its manifest must identify clean content and website
revisions matching that run's commit and submodule pin. The source must be a
production-mode build at `/` with the test site's canonical origin. An expired
artifact, preview-only run, or mismatched candidate fails before deployment.

### One-time owner setup

1. Merge the website `production-pages` branch into this repository's `main`.
   The owner handles PR creation/merge; SSH delivery does not require app access.
2. In **ccozianu/devcapsule-website → Settings → Pages**, select source
   **GitHub Actions**. Skip the suggested templates: this workflow already exists.
3. Set its custom domain to **devcapsule.mycodespace.ai**. In the `mycodespace.ai`
   DNS zone, create **CNAME `devcapsule` → `ccozianu.github.io`**. Keep the parent's
   test domain and its CNAME intact. Both hostnames point to the same GitHub
   hostname but belong to separate repositories' Pages sites. Enable **Enforce
   HTTPS** once GitHub finishes provisioning the production certificate.
4. Create a fine-grained personal access token owned by `ccozianu`, selecting
   only the **devcapsule** repository and repository permission **Actions: read**
   (GitHub also grants the required basic metadata access). In
   **devcapsule-website → Settings → Secrets and variables → Actions**, add a
   repository secret named **CANDIDATE_READ_TOKEN** with that value. Enter it
   directly in GitHub, never in chat or source. Choose an expiry and renew it
   when needed. It reads candidate artifacts; production deployment uses this
   repository's own short-lived `GITHUB_TOKEN`, with `pages: write` and
   `id-token: write`. No cross-repository write token is needed.
5. In **Settings → Environments → github-pages**, restrict deployment to `main`.
   An owner review gate is optional; if enabled, ensure its self-review policy
   permits the owner's intended solo workflow. The workflow itself already
   requires a manual dispatch and only prepares deployments from `main`.

### Publish or roll back

Open **Actions → Publish production website → Run workflow**, select `main`,
and enter the reviewed test run ID. Approve an environment gate if configured.
Wait for both `prepare` and `deploy` jobs to succeed. Check production HTTPS,
navigation, and `/build-info.json`: original content/implementation revisions
remain, and `promotion` identifies the source run, artifact ID/digest and target
origin. A newer workflow revision may promote an older tested implementation.

Content merges, CLI releases and website merges do not automatically publish.
Production promotion does not change the test site's deployment.
To roll back, run the same action with a previous successfully tested run ID
**while its source artifact is still retained**. The current parent workflow
retains `website-preview` for seven days. Deleted or expired artifacts cannot be
promoted; prepare and review another test deployment instead. This initial
mechanism is not a permanent release archive. Failed preparation leaves the
previous production deployment in place.

The first known candidate is run `35187865183`, verified on 2026-09-17 with
content `8233dab98bf85710bb73ebd3e66ef0b29880eaf4` and website
`b55ea0a378725080bc7cf13b2c78844b2d225c52`. Its source artifact expires on
2026-09-24 unless deleted earlier. Always select the run you actually reviewed.

The standalone repository remains independently buildable. It does not dispatch
a parent workflow or write content into DevCapsule. The parent integration is
only the gitlink, one shell entry point, and one workflow.

GitHub references: [Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages),
[artifact downloads across repositories](https://github.com/actions/download-artifact#download-artifacts-from-other-workflow-runs-or-repositories),
[custom domains and HTTPS](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
