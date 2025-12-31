const { app, BrowserWindow, screen, ipcMain } = require('electron/main')
const path = require('path')
const fs = require('fs')

// 配置文件路径
const configPath = path.join(app.getPath('userData'), 'window-config.json')

// 获取默认位置（右上角）
const getDefaultPosition = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  return [width - 320, 20] // 距离右边20px，顶部20px
}

// 读取保存的窗口位置
const loadWindowPosition = () => {
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      return [config.x, config.y]
    }
  } catch (err) {
    console.warn('读取配置文件失败:', err)
  }
  return getDefaultPosition()
}

// 保存窗口位置
const saveWindowPosition = (x, y) => {
  try {
    const config = { x, y, timestamp: Date.now() }
    fs.writeFileSync(configPath, JSON.stringify(config))
  } catch (err) {
    console.error('保存配置文件失败:', err)
  }
}

// 主窗口
let mainWindow;

// 作业输入窗口
let homeworkWindow;

const createWindow = () => {
  const [defaultX, defaultY] = loadWindowPosition()
  
  mainWindow = new BrowserWindow({
    width: 320,  // 增加宽度以适应内容
    height: 400, // 增加高度以显示更多内容
    x: defaultX,
    y: defaultY,
    // 设置为无边框窗口
    frame: false,
    // 始终在最前（可被其他窗口覆盖）
    alwaysOnTop: false,
    // 设置窗口层级为桌面窗口
    type: 'desktop',
    // 背景透明
    transparent: true,
    // 可调整大小
    resizable: false,
    // 不显示在任务栏
    skipTaskbar: true,
    // 焦点丢失时是否隐藏窗口
    focusable: false,
    // 设置背景色为透明
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // 加载页面内容
  mainWindow.loadFile('pages/index.html')

  // 监听窗口移动事件，保存位置
  mainWindow.on('moved', () => {
    const [x, y] = mainWindow.getPosition()
    saveWindowPosition(x, y)
  })

  // 监听窗口关闭事件，保存位置
  mainWindow.on('close', () => {
    const [x, y] = mainWindow.getPosition()
    saveWindowPosition(x, y)
  })

  return mainWindow
}

// 创建作业输入窗口
const createHomeworkWindow = () => {
  // 如果窗口已经存在，就聚焦它
  if (homeworkWindow) {
    homeworkWindow.focus();
    return;
  }


  homeworkWindow = new BrowserWindow({
    frame: true,  // 有边框，便于用户操作
    alwaysOnTop: true,  // 保持在最前面
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // 加载作业表单页面
  homeworkWindow.loadFile('pages/homework-form.html');

  homeworkWindow.setMenu(null);

  // 窗口关闭时清理引用
  homeworkWindow.on('closed', () => {
    homeworkWindow = null;
  });
};

// 应用准备就绪时
app.whenReady().then(() => {
  createWindow();

  // 监听打开作业窗口的请求
  ipcMain.on('open-homework-window', () => {
    createHomeworkWindow();
  });
  
  // 监听保存作业的请求
  ipcMain.on('save-homework', (event, homework) => {
    // 将作业数据发送回主窗口
    if (mainWindow) {
      mainWindow.webContents.send('new-homework', homework);
    }
  });
  
  // 监听作业窗口关闭事件
  ipcMain.on('homework-window-closed', () => {
    homeworkWindow = null;
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});