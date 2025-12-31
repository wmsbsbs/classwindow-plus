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

  // 获取主窗口位置，让新窗口在其旁边
  let [mainX, mainY] = mainWindow ? mainWindow.getPosition() : [100, 100];
  mainX += 50; // 偏移一点位置
  mainY += 50;

  homeworkWindow = new BrowserWindow({
    width: 400,
    height: 350,
    x: mainX,
    y: mainY,
    frame: true,  // 有边框，便于用户操作
    alwaysOnTop: true,  // 保持在最前面
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // 创建作业输入表单的HTML
  const homeworkFormHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>添加作业</title>
      <style>
        body {
          margin: 0;
          padding: 20px;
          background: #2d2d2d;
          color: white;
          font-family: Arial, sans-serif;
        }
        .container {
          max-width: 100%;
          padding: 0 10px;
        }
        h2 {
          margin-top: 0;
          color: #4CAF50;
        }
        .input-group {
          margin: 15px 0;
        }
        .input-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        .input-group select,
        .input-group textarea,
        .input-group input {
          width: 100%;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #555;
          background: #333;
          color: white;
          box-sizing: border-box;
        }
        .input-group textarea {
          height: 120px;
          resize: vertical;
        }
        .button-group {
          text-align: right;
          margin-top: 20px;
        }
        button {
          padding: 8px 16px;
          margin-left: 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .save-btn {
          background: #2196F3;
          color: white;
        }
        .cancel-btn {
          background: #f44336;
          color: white;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>添加作业</h2>
        <div class="input-group">
          <label>科目:</label>
          <select id="subjectSelect">
            <option value="chinese">语文</option>
            <option value="math">数学</option>
            <option value="english">英语</option>
            <option value="physics">物理</option>
            <option value="chemistry">化学</option>
            <option value="biology">生物</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div class="input-group">
          <label>作业内容:</label>
          <textarea id="homeworkContent" placeholder="输入作业内容..."></textarea>
        </div>
        <div class="input-group">
          <label>截止日期 (可选):</label>
          <input type="date" id="dueDate">
        </div>
        <div class="button-group">
          <button class="cancel-btn" id="cancelBtn">取消</button>
          <button class="save-btn" id="saveBtn">保存</button>
        </div>
      </div>

      <script>
        const { ipcRenderer } = require('electron');
        
        document.getElementById('saveBtn').addEventListener('click', () => {
          const subject = document.getElementById('subjectSelect').value;
          const content = document.getElementById('homeworkContent').value.trim();
          const dueDate = document.getElementById('dueDate').value;
          
          if (content) {
            ipcRenderer.send('save-homework', {
              subject: subject,
              content: content,
              dueDate: dueDate || null,
              timestamp: new Date().toISOString()
            });
            
            window.close();
          } else {
            alert('请输入作业内容');
          }
        });
        
        document.getElementById('cancelBtn').addEventListener('click', () => {
          window.close();
        });
        
        // 关闭窗口时清理引用
        window.addEventListener('beforeunload', () => {
          ipcRenderer.send('homework-window-closed');
        });
      <\/script>
    </body>
    </html>
  `;

  homeworkWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(homeworkFormHTML)}`);

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