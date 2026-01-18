const path = require('path');
const fs = require('fs');
const { app } = require('electron/main');

// 缓存配置对象，减少文件I/O操作
let positionCache = null;
let lastModifiedTime = 0;

// 获取窗口位置配置文件路径
const getPositionConfigPath = () => {
  let configDir;
  
  if (app.isPackaged) {
    // 在打包应用中，将配置文件存储在可执行文件的同级目录
    const appDir = path.dirname(app.getPath('exe'));
    configDir = path.join(appDir, 'data');
  } else {
    configDir = path.join(__dirname, 'data');
  }
  
  return path.join(configDir, 'window-position.json');
};

// 确保配置目录存在
const ensureConfigDir = () => {
  const configPath = getPositionConfigPath();
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 加载窗口位置配置
const loadWindowPosition = () => {
  try {
    const configPath = getPositionConfigPath();
    
    // 检查文件是否存在
    if (!fs.existsSync(configPath)) {
      return null;
    }
    
    // 检查文件是否被修改过
    const stats = fs.statSync(configPath);
    const currentModifiedTime = stats.mtimeMs;
    
    // 如果缓存存在且文件未修改，直接返回缓存
    if (positionCache && currentModifiedTime === lastModifiedTime) {
      return positionCache;
    }
    
    // 读取并解析配置文件
    const position = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    // 更新缓存和修改时间
    positionCache = position;
    lastModifiedTime = currentModifiedTime;
    return position;
  } catch (err) {
    console.warn('读取窗口位置配置失败:', err);
    return null;
  }
};

// 保存窗口位置配置
const saveWindowPosition = (x, y) => {
  try {
    ensureConfigDir();
    const configPath = getPositionConfigPath();
    const position = { x, y, timestamp: Date.now() };
    
    // 写入配置文件
    fs.writeFileSync(configPath, JSON.stringify(position, null, 2));
    
    // 更新缓存和修改时间
    positionCache = position;
    const stats = fs.statSync(configPath);
    lastModifiedTime = stats.mtimeMs;
    
    console.log('窗口位置已保存:', { x, y });
  } catch (err) {
    console.error('保存窗口位置失败:', err);
  }
};

// 清除窗口位置配置
const clearWindowPosition = () => {
  try {
    const configPath = getPositionConfigPath();
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
      positionCache = null;
      lastModifiedTime = 0;
      console.log('窗口位置配置已清除');
    }
  } catch (err) {
    console.error('清除窗口位置配置失败:', err);
  }
};

module.exports = {
  loadWindowPosition,
  saveWindowPosition,
  clearWindowPosition
};