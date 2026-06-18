// Project commit convention: `[AuthorName][type]:description`
// e.g. `[AhmedMuhammedElsaid][feat]:add coach clients redesign`
module.exports = {
  parserPreset: {
    parserOpts: {
      headerPattern: /^\[([^\]]+)\]\[([^\]]+)\]:\s*(.+)$/,
      headerCorrespondence: ['scope', 'type', 'subject'],
    },
  },
  rules: {
    'type-empty': [2, 'never'],
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'chore']],
    'subject-empty': [2, 'never'],
    'header-max-length': [2, 'always', 120],
  },
};
