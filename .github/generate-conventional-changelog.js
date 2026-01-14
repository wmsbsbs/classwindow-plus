const { execSync } = require('child_process');
const fs = require('fs');

// 自定义配置
const config = {
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
  ]
};

// 获取最新的标签
let latestTag = '';
try {
  latestTag = execSync('git describe --tags $(git rev-list --tags --max-count=1)', { encoding: 'utf8' }).trim();
} catch (e) {
  // 如果没有标签，则使用初始标签
  latestTag = '';
}

// 获取提交历史
let commits;
if (!latestTag) {
  commits = execSync('git log --pretty=format:"%s||%b||%an" --reverse HEAD', { encoding: 'utf8' });
} else {
  commits = execSync(`git log --pretty=format:"%s||%b||%an" --reverse ${latestTag}..HEAD`, { encoding: 'utf8' });
}

// 解析提交
const commitList = commits.split('\n').filter(c => c.trim() !== '');

// 按类型分组提交
const groupedCommits = {};
commitList.forEach(commit => {
  const [subject, body, author] = commit.split('||');
  const match = subject.match(/^(feat|feature|fix|perf|docs|style|refactor|test|build|ci|chore)(?:\(.+\))?:\s*(.+)$/i);
  
  let type = 'chore'; // 默认类型
  let message = subject;
  
  if (match) {
    type = match[1].toLowerCase();
    message = match[2];
  }
  
  // 查找对应的分组名
  const typeConfig = config.types.find(t => t.type === type);
  const sectionName = typeConfig ? typeConfig.section : '🧹 其他变更 Chore';
  
  if (!groupedCommits[sectionName]) {
    groupedCommits[sectionName] = [];
  }
  
  groupedCommits[sectionName].push({
    type,
    message,
    author: author || 'Unknown'
  });
});

// 生成 changelog 内容
let changelogContent = '## 更新日志\n\n';

Object.keys(groupedCommits).forEach(section => {
  if (groupedCommits[section].length > 0) {
    changelogContent += `### ${section}\n\n`;
    
    groupedCommits[section].forEach(commit => {
      changelogContent += `- ${commit.message} (${commit.author})\n`;
    });
    
    changelogContent += '\n';
  }
});

// 输出到文件
fs.writeFileSync('temp_changelog.md', changelogContent);
console.log('Changelog generated successfully');