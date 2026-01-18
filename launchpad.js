const { app } = require('electron/main');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { shell } = require('electron');

const CONFIG_PATH = path.join(__dirname, 'data/config.json');

// 确保配置目录存在
const ensureConfigDir = () => {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 读取配置文件
const loadConfig = () => {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (err) {
    console.warn('读取配置文件失败:', err);
  }
  return {};
};

// 保存配置文件
const saveConfig = (config) => {
  try {
    ensureConfigDir();
    config.timestamp = Date.now();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (err) {
    console.error('保存配置文件失败:', err);
  }
};

// 启动台应用管理函数
const addLaunchpadApp = (app) => {
  try {
    ensureConfigDir();
    const config = loadConfig();
    if (!config.launchpadApps) {
      config.launchpadApps = [];
    }
    // 设置默认类型为应用
    if (!app.type) {
      app.type = 'app';
    }
    // 保存图标信息
    config.launchpadApps.push(app);
    config.timestamp = Date.now();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    
    return config.launchpadApps;
  } catch (err) {
    console.error('添加启动台应用失败:', err);
    return null;
  }
};

const removeLaunchpadApp = (index) => {
  try {
    ensureConfigDir();
    const config = loadConfig();
    if (config.launchpadApps && config.launchpadApps.length > index) {
      config.launchpadApps.splice(index, 1);
      config.timestamp = Date.now();
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
      
      return config.launchpadApps;
    }
    return null;
  } catch (err) {
    console.error('删除启动台应用失败:', err);
    return null;
  }
};

const getLaunchpadApps = () => {
  const config = loadConfig();
  return config.launchpadApps || [];
};

// 启动应用或打开链接函数
const launchAppOrLink = (app) => {
  try {
    if (app.type === 'link') {
      // 如果是链接类型，使用shell打开
      shell.openExternal(app.path);
    } else {
      // 如果是应用程序类型，使用execFile启动
      execFile(app.path, (error) => {
        if (error) {
          console.error('启动应用失败:', error);
          // 可以向渲染进程发送错误信息
          if (mainWindow) {
            mainWindow.webContents.send('launch-app-error', error.message);
          }
        }
      });
    }
  } catch (error) {
    console.error('启动应用或打开链接异常:', error);
  }
};

module.exports = {
  addLaunchpadApp,
  removeLaunchpadApp,
  getLaunchpadApps,
  launchAppOrLink
};