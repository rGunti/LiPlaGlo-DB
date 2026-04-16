import { execSync } from 'child_process';
import * as logging from '../utils/logging.js';

function getGitInfo() {
  try {
    const commit = execSync('git rev-parse HEAD').toString().trim();
    const status = execSync('git status --porcelain').toString().trim();
    const isDirty = status.length > 0;

    let tag = null;
    try {
      tag = execSync('git describe --tags --exact-match HEAD').toString().trim();
    } catch {
      // no exact tag on this commit, fall back to SHA
    }

    return {
      commit: commit.substring(0, 8),
      dirty: isDirty,
      tag,
    };
  } catch (error) {
    logging.logError('Error retrieving Git info', error.message);
    throw error;
  }
}

export function getDatabaseVersion() {
    const git = getGitInfo();
    const base = git.tag ?? git.commit;
    return git.dirty ? `${base}-dirty` : base;
}
