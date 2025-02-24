/**
 * Gets a single release line for a changeset
 *
 * @param {import("@changesets/types").NewChangesetWithCommit} changeset
 * @param {import("@changesets/types").VersionType} _type
 * @returns {Promise<string>}
 */
const getReleaseLine = async (changeset, _type) => {
  let lines = changeset.summary
    .split('\n')
    .map((l) => l.trim().replace(/^\-\s*/, ''))
    .map((l) => `- ${l}`);

  if (changeset.commit) {
    lines = lines.map((l) => `${l} [${changeset.commit.slice(0, 7)}]`);
  }

  return lines.join('\n');
};

/**
 *
 * @param {import("@changesets/types").NewChangesetWithCommit[]} changesets
 * @param {import("@changesets/types").ModCompWithPackage[]} dependenciesUpdated
 * @returns {Promise<string>}
 */
const getDependencyReleaseLine = async (changesets, dependenciesUpdated) => {
  if (dependenciesUpdated.length === 0) {
    return '';
  }

  const changesetLinks = changesets.map(
    (changeset) =>
      `- Updated dependencies${
        changeset.commit ? ` [${changeset.commit.slice(0, 7)}]` : ''
      }`
  );

  const updatedDependenciesList = dependenciesUpdated.map(
    (dependency) => `  - ${dependency.name}@${dependency.newVersion}`
  );

  return [...changesetLinks, ...updatedDependenciesList].join('\n');
};

/**
 *
 * @type {import("@changesets/types").ChangelogFunctions}
 */
const defaultChangelogFunctions = {
  getReleaseLine,
  getDependencyReleaseLine,
};

export default defaultChangelogFunctions;
