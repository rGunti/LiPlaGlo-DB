import { execSync } from 'child_process';
import * as logging from '../utils/logging.js';

function getGitInfo() {
  try {
    const commit = execSync('git rev-parse HEAD').toString().trim();
    const status = execSync('git status --porcelain').toString().trim();
    const isDirty = status.length > 0;

    return {
      commit: commit.substring(0, 8),
      dirty: isDirty,
    };
  } catch (error) {
    logging.logError('Error retrieving Git info', error.message);
    throw error;
  }
}

export function getDatabaseVersion() {
    const git = getGitInfo();
    return git.dirty ? `${git.commit}-dirty` : `${git.commit}`;
}
