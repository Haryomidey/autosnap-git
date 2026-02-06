const sensitivePatterns = [
  /^\.env($|\.)/i,
  /(^|\/|\\)id_rsa$/i,
  /(^|\/|\\).*\.pem$/i,
  /(^|\/|\\).*\.key$/i,
  /(^|\/|\\).*credentials.*$/i,
  /(^|\/|\\).*secret.*$/i,
];

const uniq = (items) => [...new Set(items.filter(Boolean))];

export const getStatus = async (git) => git.status();

export const hasChanges = (status) =>
  status.files.length > 0 ||
  status.created.length > 0 ||
  status.modified.length > 0 ||
  status.deleted.length > 0 ||
  status.not_added.length > 0 ||
  status.renamed.length > 0;

export const listChangedFiles = (status) => {
  const renamed = status.renamed.map((entry) => entry.to);
  return uniq([
    ...status.modified,
    ...status.created,
    ...status.deleted,
    ...status.not_added,
    ...renamed,
  ]);
};

export const findSensitiveFiles = (files) =>
  files.filter((file) => sensitivePatterns.some((pattern) => pattern.test(file)));
