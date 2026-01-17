const path = require('path');
const fs = require('fs');
const { app } = require('electron/main');

let CONFIG_PATH;

// 初始化配置路径
const initConfigPath = (resourcesRoot) => {
  if (app.isPackaged) {
    // 在打包应用中，将配置文件存储在可执行文件的同级目录
    const appDir = path.dirname(app.getPath('exe'));
    const CONFIG_DIR = path.join(appDir, 'data');
    CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
  } else {
    CONFIG_PATH = path.join(__dirname, 'data/config.json');
  }
};

// 确保配置目录存在
const ensureConfigDir = () => {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 缓存配置对象，减少文件I/O操作
let configCache = null;
let lastModifiedTime = 0;

// 读取配置文件
const loadConfig = () => {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(CONFIG_PATH)) {
      return {};
    }
    
    // 检查文件是否被修改过
    const stats = fs.statSync(CONFIG_PATH);
    const currentModifiedTime = stats.mtimeMs;
    
    // 如果缓存存在且文件未修改，直接返回缓存
    if (configCache && currentModifiedTime === lastModifiedTime) {
      return configCache;
    }
    
    // 读取并解析配置文件
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    // 更新缓存和修改时间
    configCache = config;
    lastModifiedTime = currentModifiedTime;
    return config;
  } catch (err) {
    console.warn('读取配置文件失败:', err);
    return {};
  }
};

// 保存配置文件
const saveConfig = (config) => {
  try {
    ensureConfigDir();
    config.timestamp = Date.now();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    // 更新缓存和修改时间
    configCache = config;
    const stats = fs.statSync(CONFIG_PATH);
    lastModifiedTime = stats.mtimeMs;
  } catch (err) {
    console.error('保存配置文件失败:', err);
  }
};

// 创建设置处理器
const createSettingHandler = (settingName, toggleEvent) => ({
  load: () => {
    try {
      // 使用loadConfig()函数获取配置，利用缓存机制
      const config = loadConfig();
      return config[settingName] !== undefined ? config[settingName] : true;
    } catch (err) {
      console.warn(`读取${settingName}设置失败:`, err);
    }
    return true;
  },
  
  save: (isEnabled) => {
    try {
      // 使用loadConfig()函数获取配置，利用缓存机制
      const config = loadConfig();
      config[settingName] = isEnabled;
      // 使用saveConfig()函数保存配置，更新缓存
      saveConfig(config);
    } catch (err) {
      console.error(`保存${settingName}设置失败:`, err);
    }
  },
  
  handleToggle: (isEnabled, mainWindow) => {
    // 保存设置到配置文件
    createSettingHandler(settingName, toggleEvent).save(isEnabled);
    
    // 根据开关状态控制显示/隐藏
    if (mainWindow) {
      mainWindow.webContents.send(toggleEvent, isEnabled);
    }
  }
});

module.exports = {
  initConfigPath,
  loadConfig,
  saveConfig,
  createSettingHandler,
  ensureConfigDir
};