# Releasing

Releases are automated with [Changesets](https://github.com/changesets/changesets) and published from GitHub Actions with [npm trusted publishing](https://docs.npmjs.com/trusted-publishers), so no npm token is stored anywhere.

## How a release happens

1. Pull requests that change what users get include a changeset (`yarn changeset`).
2. When they land on `main`, the Release workflow opens or updates a **Version Packages** pull request. It bumps the version and moves the changesets into `CHANGELOG.md`.
3. Merging that pull request publishes the new version to npm.

## Setup (done once)

1. **First publish by hand.** npm only lets you add a trusted publisher to a package that exists. 0.1.0 was published this way.

2. **Add the trusted publisher** on npmjs.com: the package's Settings → Trusted publishing → GitHub Actions, with:
   - Organization or user: `ninadsutrave`
   - Repository: `react-native-shrinking-tab-bar`
   - Workflow filename: `release.yml`

3. **Let Actions open pull requests:** Settings → Actions → General → Workflow permissions → "Allow GitHub Actions to create and approve pull requests".

4. **Turn the workflow on:** Settings → Secrets and variables → Actions → Variables, `NPM_RELEASE` = `enabled`. Remove the variable to pause releases.

Because the repository is public, npm adds [provenance](https://docs.npmjs.com/generating-provenance-statements) to every release automatically.

The Version Packages pull request is opened by the workflow's own token, so CI doesn't run on it. Everything in it was already checked on `main`.

## Versioning

The package follows [Semantic Versioning](https://semver.org/). While it's 0.x, a minor release may contain breaking changes; the changelog calls them out. 1.0 comes once the supported platforms in the README's requirements table are all tested.
