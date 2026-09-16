# Build and publication

DevCapsule owns publication. Its `scripts/website.sh` invokes this project's
build using the parent content checkout and the pinned website Git revision.
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

## Final GitHub wiring (owner, after review)

The owner explicitly deferred GitHub backend wiring during the autonomy
experiment. The workflow is prepared in DevCapsule, but local execution of its
build/check scripts is the accepted validation here. No hosted deployment or
GitHub Actions run is claimed until the owner performs this wiring.

1. Review and merge the website `initial-cut` branch into this repository's
   `main`. Preserve the reviewed SHA as an available commit. Then review and
   merge DevCapsule's `website/initial-cut` PR, including its website gitlink.
   With a squash merge, update the parent gitlink to the merged website commit
   and rebuild before merging the parent. Deliver records/finalize the parent
   workstream under its `WORKFLOW.md` when merge-ready.
2. In **ccozianu/devcapsule** (the parent), enable GitHub Actions and set
   **Settings → Pages → Build and deployment → Source: GitHub Actions**.
   The prepared workflow uses `contents: read`, `pages: write`, and
   `id-token: write`; it needs no long-lived deployment token. Standard public
   Linux runners and Pages are expected to incur no hosting cost. No paid runner,
   cloud service, or new domain purchase is part of this setup.
3. In DevCapsule's `github-pages` environment, allow the reviewed `main` branch
   and add the owner as required reviewer if that control is available. The
   workflow only permits production deployment when run from `main`; previews
   build artifacts without deploying.
4. For production, verify `mycodespace.ai` under the owner's GitHub Pages domain
   settings. Add `devcapsule.mycodespace.ai` as DevCapsule's Pages custom domain
   first. Then create the DNS `CNAME` record `devcapsule` → `ccozianu.github.io`
   (the target has no repository path). Once GitHub's certificate is ready,
   enable **Enforce HTTPS**. Keep any existing unrelated DNS records intact.
5. Run **Actions → Website → Run workflow** on `main`. Select `production`,
   origin `https://devcapsule.mycodespace.ai`, base path `/`. Approve the
   deployment environment if required. Check the homepage, guide navigation,
   journal, HTTPS, and `/build-info.json` against the reviewed revisions.

For an optional hosted review before assigning the domain, the owner may instead
use GitHub's project URL, origin `https://ccozianu.github.io`, base path
`/devcapsule/`. That is still a public deployment and requires an explicit owner
publication decision. The local review needs no hosted preview.

Publication is **manual only**. Content merges, website pointer changes, and
releases do not silently launch or update production. Each owner-triggered run
publishes the exact parent commit selected for that run, with its pinned
presentation commit. To roll back, revert the relevant content/gitlink in a
reviewed parent commit and trigger publication again. No force-push is needed.

The standalone repository remains independently buildable. It does not dispatch
a parent workflow or write content into DevCapsule. The parent integration is
only the gitlink, one shell entry point, and one workflow.

GitHub references: [Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages),
[custom domains and HTTPS](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site),
[Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
