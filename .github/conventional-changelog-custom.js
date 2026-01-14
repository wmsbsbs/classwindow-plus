module.exports = {
  types: [
    { type: 'feat', section: '✨ 新功能 Features' },
    { type: 'feature', section: '✨ 新功能 Features' },
    { type: 'fix', section: '🐛 问题修复 Bug Fixes' },
    { type: 'perf', section: '⚡ 性能优化 Performance Improvements' },
    { type: 'docs', section: '📚 文档 Documentation' },
    { type: 'style', section: '🎨 样式调整 Style Changes' },
    { type: 'refactor', section: '🔨 重构 Refactoring' },
    { type: 'test', section: '🧪 测试 Tests' },
    { type: 'build', section: '📦 构建系统 Build System' },
    { type: 'ci', section: '🔄 CI/CD' },
    { type: 'chore', section: '🧹 其他变更 Chore' }
  ],
  commitUrlFormat: '{{host}}/{{owner}}/{{repository}}/commit/{{hash}}',
  compareUrlFormat: '{{host}}/{{owner}}/{{repository}}/compare/{{previousTag}}...{{currentTag}}',
  issueUrlFormat: '{{host}}/{{owner}}/{{repository}}/issues/{{id}}',
  userUrlFormat: '{{host}}/{{owner}}/{{username}}'
};