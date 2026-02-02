const { app, BrowserWindow, screen, ipcMain, Tray, Menu, shell, dialog, protocol } = require('electron/main');
const path = require('path');
const { nativeImage } = require('electron/common');
const fs = require('fs');
const os = require('os');
const http = require('http');
const url = require('url');
const querystring = require('querystring');

// 配置模块
const {
	initConfigPath,
	loadConfig,
	saveConfig,
	createSettingHandler,
} = require('./config');

// 窗口位置管理
const {
	loadWindowPosition,
	saveWindowPosition,
	clearWindowPosition
} = require('./window-position');

// 启动台
const {
	addLaunchpadApp,
	removeLaunchpadApp,
	getLaunchpadApps,
	launchAppOrLink
} = require('./launchpad');

let iconPath;
let resourcesRoot = path.resolve(app.getAppPath());


// 初始化配置路径
initConfigPath(resourcesRoot);

// 获取Windows开机启动文件夹路径
function getStartupFolderPath() {
    if (process.platform === 'win32') {
        // 获取当前用户的开机启动文件夹
        return path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
    }
    return null;
}

// 获取应用程序可执行文件路径
function getAppExePath() {
    if (app.isPackaged) {
        return process.execPath;
    }
    return process.argv[0];
}

// 开机自启动相关功能已通过app.setLoginItemSettings实现


if (app.isPackaged) {
	iconPath = path.join(resourcesRoot, "assets/logo.jpg");
} else {
	iconPath = path.join(__dirname, "assets/logo.jpg");
}

// 根据配置获取窗口位置
const getWindowPosition = () => {
	const config = loadConfig();
	const { width, height } = screen.getPrimaryDisplay().workAreaSize;
	const windowPosition = config.windowPosition || 'top-right';
	const mainInterfaceScale = config.mainInterfaceScale || 100;
	
	// 设置基础窗口宽度，然后根据缩放比例调整
	const baseWidth = 300;
	const winWidth = Math.round(baseWidth * mainInterfaceScale / 100);
	// 使用实际的窗口高度进行居中计算
	const winHeight = 800;
	// 获取偏移量设置，默认0
	const offsetX = config.windowOffset?.x || 0;
	const offsetY = config.windowOffset?.y || 0;
	
	let x, y;
	
	// 根据配置计算窗口位置
	switch (windowPosition) {
		case 'center':
			x = Math.round((width - winWidth) / 2) + offsetX;
			y = Math.round((height - winHeight) / 2) + offsetY;
			break;
		case 'top-left':
			x = 20 + offsetX;
			y = 20 + offsetY;
			break;
		case 'top-right':
			x = width - winWidth - 20 + offsetX;
			y = 20 + offsetY;
			break;
		case 'bottom-right':
			x = width - winWidth - 20 + offsetX;
			y = height - winHeight - 20 + offsetY;
			break;
		case 'bottom-left':
			x = 20 + offsetX;
			y = height - winHeight - 20 + offsetY;
			break;
		default:
			x = width - winWidth - 20 + offsetX;
			y = 20 + offsetY;
			break;
	}
	
	return [x, y];
};

// 读取/保存窗口位置
const getSavedWindowPosition = () => {
	const savedPosition = loadWindowPosition();
	if (savedPosition && savedPosition.x !== undefined && savedPosition.y !== undefined) {
		return [savedPosition.x, savedPosition.y];
	}
	return getWindowPosition();
};

const saveCurrentWindowPosition = (x, y) => {
	saveWindowPosition(x, y);
};

// 主窗口
let mainWindow;

const createWindow = () => {
	const [defaultX, defaultY] = getSavedWindowPosition();

	// 读取配置
	const config = loadConfig();
	const isAlwaysOnTop = config.alwaysOnTop !== undefined ? config.alwaysOnTop : false;
	const isDarkThemeEnabled = config.darkThemeEnabled !== undefined ? config.darkThemeEnabled : false;
	const windowBlur = config.windowBlur || 10;
	const mainInterfaceScale = config.mainInterfaceScale || 100;
	
	// 设置基础窗口宽度，然后根据缩放比例调整
	const baseWidth = 300;
	const winWidth = Math.round(baseWidth * mainInterfaceScale / 100);
	
	// 设置足够大的初始高度，防止内容被截断
	const winHeight = 800;

	mainWindow = new BrowserWindow({
		width: winWidth,
		height: winHeight,
		x: defaultX,
		y: defaultY,
		// 设置为无边框窗口
		frame: false,
		// 根据配置设置是否置顶
		alwaysOnTop: isAlwaysOnTop,
		// 背景透明
		transparent: true,
		// 初始不可调整大小，与锁按钮初始状态一致
		resizable: false,
		// 不显示在任务栏
		skipTaskbar: true,
		// 允许窗口接收焦点，以便用户交互
		focusable: true,
		// 允许窗口移动
		movable: true,
		// 设置窗口最小尺寸
		minWidth: 300,
		minHeight: 400,
		webPreferences: {
				nodeIntegration: true,
				contextIsolation: false
			}
	});

	// 为无边框窗口添加完整的大小调整支持
	let isResizing = false;
	let resizeDirection = '';
	const resizeThreshold = 10; // 鼠标距离窗口边缘的阈值

	// 监听渲染进程发送的窗口锁定状态变化
	ipcMain.on('update-window-locked', (event, locked) => {
		isWindowLocked = locked;
	});

// 监听窗口大小锁定请求
ipcMain.on('set-window-resizable', (event, resizable) => {
	if (mainWindow) {
		mainWindow.setResizable(resizable);
		console.log('Window resizable property actually set to:', mainWindow.isResizable());
		
		// 如果可调整大小，添加拖拽调整大小的支持
		if (resizable) {
			// 添加鼠标事件监听器，用于拖拽调整窗口大小
			mainWindow.on('will-resize', (event, newBounds) => {
				// 可以在这里添加窗口大小调整的限制
				// 例如：event.preventDefault() 可以阻止窗口大小调整
			});
		} else {
			// 如果不可调整大小，移除鼠标事件监听器
			mainWindow.removeAllListeners('will-resize');
		}
	}
});

	// 添加一个方法来手动调整窗口大小
	ipcMain.on('resize-window', (event, width, height) => {
		if (mainWindow && !isWindowLocked) {
			mainWindow.setSize(width, height, true);
		}
	});

	// 添加一个方法来获取当前窗口大小
	ipcMain.on('get-window-size', (event) => {
		if (mainWindow) {
			const size = mainWindow.getSize();
			event.sender.send('window-size', size[0], size[1]);
		}
	});
	
	// 监听窗口内容加载完成事件，调整窗口大小以适应内容
	mainWindow.webContents.on('did-finish-load', () => {
		// 延迟调整，确保DOM已完全渲染
		setTimeout(() => {
			// 使用简单的方式调整窗口大小，避免复杂的JavaScript执行
			mainWindow.setSize(mainWindow.getSize()[0], 800, true);
		}, 200);
	});

	// 移除acrylic材质，使用CSS backdrop-filter实现模糊效果
	mainWindow.setBackgroundMaterial('default');

	// 加载页面内容
	mainWindow.loadFile('pages/index.html');

	// 当主窗口 DOM 就绪时发送初始状态（时钟/作业/启动台/置顶/暗色主题）
	mainWindow.webContents.once('dom-ready', () => {
		// 重新加载设置，确保变量已定义
		const domReadyClockEnabled = clockSettingHandler.load();
		const domReadyHomeworkEnabled = homeworkSettingHandler.load();
		const domReadyAlwaysOnTop = alwaysOnTopSettingHandler.load(); // 添加置顶状态变量
		const domReadyDarkThemeEnabled = darkThemeSettingHandler.load(); // 添加暗色主题状态变量
		
		mainWindow.webContents.send('clock-toggle', domReadyClockEnabled);
		mainWindow.webContents.send('homework-toggle', domReadyHomeworkEnabled);
		mainWindow.webContents.send('always-on-top-toggle', domReadyAlwaysOnTop); // 发送置顶状态
		mainWindow.webContents.send('dark-theme-toggle', domReadyDarkThemeEnabled); // 发送暗色主题状态
		mainWindow.webContents.send('launchpad-apps-updated', getLaunchpadApps());
	});

	// 监听窗口移动事件，保存位置
	mainWindow.on('moved', () => {
		const [x, y] = mainWindow.getPosition();
		saveCurrentWindowPosition(x, y);
	});

	// 监听窗口关闭事件，保存位置
	mainWindow.on('close', () => {
		const [x, y] = mainWindow.getPosition();
		saveCurrentWindowPosition(x, y);
	});
	
	// 监听窗口关闭事件，清理引用
	mainWindow.on('closed', () => {
		mainWindow = null;
	});

	return mainWindow;
};

// 作业添加窗口
let homeworkWindow;

const createHomeworkWindow = (homework = null, index = -1, subject = null) => {
	// 如果窗口已经存在，就聚焦它
	if (homeworkWindow) {
		homeworkWindow.focus();
		return;
	}

	// 获取屏幕尺寸
	const { width, height } = screen.getPrimaryDisplay().workAreaSize;
	
	// 读取配置
	const config = loadConfig();
	// 为作业窗口使用专门的配置项，默认居中
	const homeworkWindowPosition = config.homeworkWindowPosition || 'center';
	// 获取作业面板缩放比例，默认100%
	const homeworkScale = config.homeworkScale || 100;
	
	// 设置基础窗口尺寸，然后根据缩放比例调整
	let baseWidth = 1200;
	let baseHeight = 800;
	// 根据缩放比例调整窗口尺寸
	const winWidth = Math.round(baseWidth * homeworkScale / 100);
	const winHeight = Math.round(baseHeight * homeworkScale / 100);
	
	let x, y;
	
	// 根据配置计算窗口位置
	switch (homeworkWindowPosition) {
		case 'top-left':
			x = 20;
			y = 20;
			break;
		case 'top-right':
			x = width - winWidth - 20;
			y = 20;
			break;
		case 'bottom-right':
			x = width - winWidth - 20;
			y = height - winHeight - 20;
			break;
		case 'bottom-left':
			x = 20;
			y = height - winHeight - 20;
			break;
		case 'center':
		default:
			x = Math.round((width - winWidth) / 2);
			y = Math.round((height - winHeight) / 2);
			break;
	}

	homeworkWindow = new BrowserWindow({
		icon: iconPath,
		frame: false,
		alwaysOnTop: false,
		resizable: true,
		width: winWidth,
		height: winHeight,
		// 设置窗口最小尺寸，防止按钮溢出
		minWidth: 800,
		minHeight: 600,
		// 根据配置设置窗口位置
		x: x,
		y: y,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	// 加载新的拖拽式作业表单页面
	homeworkWindow.loadFile('pages/homework-form-new.html');
	homeworkWindow.setMenu(null);
	
	// 应用窗口背景模糊效果
	const blurValue = config.windowBlur || 10;
	if (blurValue > 0) {
		homeworkWindow.setBackgroundMaterial('acrylic');
		// 注意：Electron的背景模糊效果在不同平台上表现可能不同
		// 这里使用acrylic材质，在Windows上会有模糊效果
	}
	
	// 如果有作业数据，在窗口加载完成后发送到渲染进程
    if (homework) {
        homeworkWindow.webContents.once('dom-ready', () => {
            homeworkWindow.webContents.send('edit-homework-data', homework, index);
        });
    } else if (subject) {
        // 如果有选中的科目，在窗口加载完成后发送到渲染进程
        homeworkWindow.webContents.once('dom-ready', () => {
            homeworkWindow.webContents.send('subject-selected', subject);
        });
    }

	// 窗口关闭时清理引用
	homeworkWindow.on('closed', () => {
		homeworkWindow = null;
	});
};
// 作业列表窗口
let homeworkListWindow;

const createHomeworkListWindow = () => {
    // 如果窗口已经存在，就聚焦它
    if (homeworkListWindow) {
        homeworkListWindow.focus();
        return homeworkListWindow;
    }

    // 获取屏幕尺寸
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    
    // 读取配置
    const config = loadConfig();
    // 获取作业面板缩放比例，默认100%
    const homeworkScale = config.homeworkScale || 100;
    
    // 设置基础窗口尺寸，然后根据缩放比例调整
    let baseWidth = 800;
    let baseHeight = 600;
    // 根据缩放比例调整窗口尺寸
    const winWidth = Math.round(baseWidth * homeworkScale / 100);
    const winHeight = Math.round(baseHeight * homeworkScale / 100);

    homeworkListWindow = new BrowserWindow({
        icon: iconPath,
        frame: false,
        width: winWidth,
        height: winHeight,
        // 设置窗口最小尺寸，防止元素溢出
        minWidth: 600,
        minHeight: 400,
        // 计算并设置窗口居中位置
        x: Math.round((width - winWidth) / 2),
        y: Math.round((height - winHeight) / 2),
        resizable: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    homeworkListWindow.loadFile('pages/homework.html');
    homeworkListWindow.setMenu(null);

    // 窗口关闭时清理引用
    homeworkListWindow.on('closed', () => {
        homeworkListWindow = null;
    });

    return homeworkListWindow;
};

// 作业详情窗口
let homeworkDetailWindow;

const createHomeworkDetailWindow = (homework, index) => {
    // 如果窗口已经存在，就聚焦它
    if (homeworkDetailWindow) {
        homeworkDetailWindow.focus();
        return homeworkDetailWindow;
    }

    // 获取屏幕尺寸
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    
    // 设置窗口尺寸
    const winWidth = 500;
    const winHeight = 400;

    homeworkDetailWindow = new BrowserWindow({
        icon: iconPath,
        frame: false,
        width: winWidth,
        height: winHeight,
        // 计算并设置窗口居中位置
        x: Math.round((width - winWidth) / 2),
        y: Math.round((height - winHeight) / 2),
        resizable: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    homeworkDetailWindow.loadFile('pages/homework-detail.html');
    homeworkDetailWindow.setMenu(null);
    
    // 当窗口DOM加载完成后，发送作业数据
    homeworkDetailWindow.webContents.once('dom-ready', () => {
        homeworkDetailWindow.webContents.send('homework-detail-data', homework, index);
    });

    // 窗口关闭时清理引用
    homeworkDetailWindow.on('closed', () => {
        homeworkDetailWindow = null;
    });

    return homeworkDetailWindow;
};

// 模板设计器窗口
let templateDesignerWindow;

const createTemplateDesignerWindow = () => {
	// 如果窗口已经存在，就聚焦它
	if (templateDesignerWindow) {
		templateDesignerWindow.focus();
		return;
	}

	// 获取屏幕尺寸
	const { width, height } = screen.getPrimaryDisplay().workAreaSize;
	// 设置窗口尺寸
	const winWidth = 1200;
	const winHeight = 700;

	templateDesignerWindow = new BrowserWindow({
		icon: iconPath,
		frame: false,
		width: winWidth,
		height: winHeight,
		// 设置窗口最小尺寸，防止元素溢出
		minWidth: 1000,
		minHeight: 600,
		// 计算并设置窗口居中位置
		x: Math.round((width - winWidth) / 2),
		y: Math.round((height - winHeight) / 2),
		resizable: true,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	templateDesignerWindow.loadFile('pages/template-designer.html');
	templateDesignerWindow.setMenu(null);

	// 窗口关闭时清理引用
	templateDesignerWindow.on('closed', () => {
		templateDesignerWindow = null;
	});

	return templateDesignerWindow;
};

// 设置窗口
let settingsWindow;

const createSettingsWindow = () => {
	// 如果窗口已经存在，就聚焦它
	if (settingsWindow) {
		settingsWindow.focus();
		return;
	}

	settingsWindow = new BrowserWindow({
		icon: iconPath,
		frame: false,
		width: 700,
		height: 600,
		// 设置窗口最小尺寸，防止元素溢出
		minWidth: 600,
		minHeight: 500,
		resizable: true,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	settingsWindow.loadFile('pages/settings.html');
	settingsWindow.setMenu(null);

	// 窗口关闭时清理引用
	settingsWindow.on('closed', () => {
		settingsWindow = null;
	});
};

let aboutWindow;

const createAboutWindow = () => {
	if (aboutWindow) {
		aboutWindow.focus();
		return;
	}

	aboutWindow = new BrowserWindow({
		icon: iconPath,
		frame: false,
		resizable: true,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	aboutWindow.loadFile('pages/about.html');

	// 窗口关闭时清理引用
	aboutWindow.on('closed', () => {
		aboutWindow = null;
	});
};
// 欢迎页面窗口
let welcomeWindow;

const createWelcomeWindow = () => {
	if (welcomeWindow) {
		welcomeWindow.focus();
		return;
	}

	welcomeWindow = new BrowserWindow({
		icon: iconPath,
		transparent: true,
		frame: false,
		width: 800,
		height: 900,
		resizable: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	welcomeWindow.loadFile('pages/welcome.html');
	welcomeWindow.setMenu(null);

	welcomeWindow.on('closed', () => {
		welcomeWindow = null;
	});
};

// 设置处理程序
const clockSettingHandler = createSettingHandler('clockEnabled', 'clock-toggle');
const homeworkSettingHandler = createSettingHandler('homeworkEnabled', 'homework-toggle');

// 添加置顶设置处理程序
const alwaysOnTopSettingHandler = createSettingHandler('alwaysOnTop', 'always-on-top-toggle');

// 添加暗色主题设置处理程序
const darkThemeSettingHandler = createSettingHandler('darkThemeEnabled', 'dark-theme-toggle');
// 添加主题选择设置处理程序
const themeSettingHandler = createSettingHandler('theme', 'theme-change');

// 添加开机自启动设置处理程序
const startupSettingHandler = createSettingHandler('startupEnabled', 'startup-toggle');

// 添加CI自动作业设置处理程序
const ciAutoHomeworkSettingHandler = createSettingHandler('ciAutoHomeworkEnabled', 'ci-auto-homework-toggle');

let isClockEnabled = clockSettingHandler.load();
let isHomeworkEnabled = homeworkSettingHandler.load();
let isAlwaysOnTop = alwaysOnTopSettingHandler.load(); // 添加置顶状态变量
let isDarkThemeEnabled = darkThemeSettingHandler.load(); // 添加暗色主题状态变量
let isStartupEnabled = startupSettingHandler.load(); // 添加开机自启动状态变量
let isCiAutoHomeworkEnabled = ciAutoHomeworkSettingHandler.load(); // 添加CI自动作业状态变量
let currentTheme = (() => {
    const theme = themeSettingHandler.load();
    return typeof theme === 'string' ? theme : 'personal';
})(); // 添加主题状态变量
// 大屏作业窗口
let bigScreenHomeworkWindow;
// 账号管理窗口
let accountWindow;

const createAccountWindow = () => {
	// 如果窗口已经存在，就聚焦它
	if (accountWindow) {
		accountWindow.focus();
		return;
	}

	// 获取屏幕尺寸
	const { width, height } = screen.getPrimaryDisplay().workAreaSize;
	
	// 设置窗口尺寸
	const winWidth = 500;
	const winHeight = 600;

	accountWindow = new BrowserWindow({
		icon: iconPath,
		frame: false,
		width: winWidth,
		height: winHeight,
		// 计算并设置窗口居中位置
		x: Math.round((width - winWidth) / 2),
		y: Math.round((height - winHeight) / 2),
		resizable: true,
		minWidth: 400,
		minHeight: 500,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	accountWindow.loadFile('pages/account-management.html');
	accountWindow.setMenu(null);

	// 窗口关闭时清理引用
	accountWindow.on('closed', () => {
		accountWindow = null;
	});

	return accountWindow;
};
const handleClockToggle = (isEnabled) => {
	isClockEnabled = isEnabled;
	clockSettingHandler.handleToggle(isEnabled, mainWindow);
};

const handleHomeworkToggle = (isEnabled) => {
	isHomeworkEnabled = isEnabled;
	homeworkSettingHandler.handleToggle(isEnabled, mainWindow);
};

// 添加置顶切换处理函数
const handleAlwaysOnTopToggle = (isEnabled) => {
	isAlwaysOnTop = isEnabled;
	alwaysOnTopSettingHandler.handleToggle(isEnabled, mainWindow);

	// 立即应用置顶设置
	if (mainWindow) {
		mainWindow.setAlwaysOnTop(isEnabled);
	}
};

// 暗色主题切换处理函数
const handleDarkThemeToggle = (isEnabled) => {
	isDarkThemeEnabled = isEnabled;
	darkThemeSettingHandler.handleToggle(isEnabled, mainWindow);

	// 通知主窗口更新主题
	if (mainWindow) {
		mainWindow.webContents.send('dark-theme-toggle', isEnabled);
	}
	
	// 通知大屏作业窗口更新主题
	if (bigScreenHomeworkWindow) {
		bigScreenHomeworkWindow.webContents.send('dark-theme-toggle', isEnabled);
	}
};

// 主题切换处理函数
const handleThemeChange = (theme) => {
	currentTheme = theme;
	
	// 保存主题设置到配置文件
	themeSettingHandler.save(theme);
	
	// 根据主题决定显示哪个窗口，确保两种模式不会同时存在
	if (theme === 'big-screen') {
		// 如果主窗口存在，隐藏它
		if (mainWindow && !mainWindow.isDestroyed()) {
			mainWindow.hide();
		}
		
		// 如果大屏作业窗口不存在，创建它
		if (!bigScreenHomeworkWindow || bigScreenHomeworkWindow.isDestroyed()) {
			createBigScreenHomeworkWindow();
		} else {
			bigScreenHomeworkWindow.show();
		}
	} else {
		// 如果大屏作业窗口存在，关闭它
		if (bigScreenHomeworkWindow && !bigScreenHomeworkWindow.isDestroyed()) {
			bigScreenHomeworkWindow.close();
			bigScreenHomeworkWindow = null;
		}
		
		// 如果主窗口存在，显示它
		if (mainWindow && !mainWindow.isDestroyed()) {
			mainWindow.show();
		} else {
			// 如果主窗口不存在，创建它
			createWindow();
		}
	}
};

// 开机自启动切换处理函数
const handleStartupToggle = (isEnabled) => {
	isStartupEnabled = isEnabled;
	startupSettingHandler.handleToggle(isEnabled, mainWindow);

	// 异步执行开机自启动设置，避免UI卡顿
	setTimeout(() => {
		try {
			// 使用Electron内置的方法设置开机自启动
			app.setLoginItemSettings({
				openAtLogin: isEnabled,
				name: 'ClassWindow Plus',
				path: process.execPath,
				args: []
			});
			console.log('开机自启动设置:', isEnabled);
		} catch (error) {
			console.error('设置开机自启动失败:', error);
		}
	}, 0);
};

// CI自动作业切换处理函数
const handleCiAutoHomeworkToggle = (isEnabled) => {
	isCiAutoHomeworkEnabled = isEnabled;
	ciAutoHomeworkSettingHandler.handleToggle(isEnabled, mainWindow);

	// 通知主窗口更新CI自动作业设置
	if (mainWindow) {
		mainWindow.webContents.send('ci-auto-homework-toggle', isEnabled);
	}

	console.log('CI自动作业设置:', isEnabled);
};

// 创建大屏作业显示窗口
const createBigScreenHomeworkWindow = () => {
	// 如果窗口已经存在，就聚焦它
	if (bigScreenHomeworkWindow && !bigScreenHomeworkWindow.isDestroyed()) {
		bigScreenHomeworkWindow.focus();
		return;
	}

	// 获取屏幕尺寸
	const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
	
	// 加载保存的窗口大小和位置，如果没有则使用默认值
	let winWidth, winHeight, winX, winY;
	try {
		const config = loadConfig();
		if (config.bigScreenWindow) {
			winWidth = config.bigScreenWindow.width;
			winHeight = config.bigScreenWindow.height;
			winX = config.bigScreenWindow.x;
			winY = config.bigScreenWindow.y;
			
			// 确保窗口在屏幕范围内
			if (winX + winWidth > screenWidth) winX = screenWidth - winWidth;
			if (winY + winHeight > screenHeight) winY = screenHeight - winHeight;
			if (winX < 0) winX = 0;
			if (winY < 0) winY = 0;
		} else {
			// 设置默认尺寸（底部居中，占屏幕宽度的80%，高度的60%）
			winWidth = Math.round(screenWidth * 0.8);
			winHeight = Math.round(screenHeight * 0.8);
			winX = Math.round((screenWidth - winWidth) / 2);
			winY = Math.round(screenHeight - winHeight - 20);
		}
	} catch (e) {
		console.warn('加载大屏作业窗口大小和位置失败，使用默认值:', e);
		// 设置默认尺寸（底部居中，占屏幕宽度的80%，高度的60%）
		winWidth = Math.round(screenWidth * 0.8);
		winHeight = Math.round(screenHeight * 0.6);
		winX = Math.round((screenWidth - winWidth) / 2);
		winY = Math.round(screenHeight - winHeight - 20);
	}

	bigScreenHomeworkWindow = new BrowserWindow({
		icon: iconPath,
		frame: false,
		width: winWidth,
		height: winHeight,
		x: winX,
		y: winY,
		alwaysOnTop: false,
		resizable: true,
		skipTaskbar: true, // 不在任务栏显示图标
		transparent: true, // 设置窗口透明
		roundedCorners: true, // 启用圆角
		// 明确设置最小和最大尺寸
		minWidth: 200,
		minHeight: 150,
		maxWidth: screenWidth,
		maxHeight: screenHeight,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	bigScreenHomeworkWindow.loadFile('pages/big-screen-homework-new.html');
	bigScreenHomeworkWindow.setMenu(null);
	
	// 确保窗口可以调整大小和移动
	// 这些属性已经在窗口创建时设置，这里再次确认
	bigScreenHomeworkWindow.setResizable(true);
	bigScreenHomeworkWindow.setMovable(true);
	
	// 确保窗口始终在底部，通过设置alwaysOnTop为false并使用最低层级实现
	bigScreenHomeworkWindow.setAlwaysOnTop(false);
	
	// 监听窗口获得焦点事件，确保焦点不会改变窗口层级
	bigScreenHomeworkWindow.on('focus', () => {
		// 在获得焦点后立即将窗口置于底层
		bigScreenHomeworkWindow.setAlwaysOnTop(false);
		// 延迟一段时间再次确认，确保层级设置生效
		setTimeout(() => {
			bigScreenHomeworkWindow.setAlwaysOnTop(false);
		}, 100);
	});
	
	// 监听窗口显示事件，再次确认窗口层级
	bigScreenHomeworkWindow.on('show', () => {
		bigScreenHomeworkWindow.setAlwaysOnTop(false);
	});
	
	// 监听窗口激活事件
	bigScreenHomeworkWindow.on('activate', () => {
		bigScreenHomeworkWindow.setAlwaysOnTop(false);
	});
	
	// 初始化大屏模式模糊效果
	const config = loadConfig();
	const bigScreenBlur = config.bigScreenBlur || 10;
	bigScreenHomeworkWindow.webContents.once('dom-ready', () => {
		bigScreenHomeworkWindow.webContents.send('update-big-screen-blur', bigScreenBlur);
	});
	
	// 窗口关闭时清理引用
	bigScreenHomeworkWindow.on('closed', () => {
		// 保存大屏作业窗口的大小和位置
		try {
			const config = loadConfig();
			if (bigScreenHomeworkWindow && !bigScreenHomeworkWindow.isDestroyed()) {
				const [width, height] = bigScreenHomeworkWindow.getSize();
				const [x, y] = bigScreenHomeworkWindow.getPosition();
				config.bigScreenWindow = {
					width,
					height,
					x,
					y
				};
				saveConfig(config);
			}
		} catch (e) {
			console.warn('保存大屏作业窗口大小和位置失败:', e);
		}
		bigScreenHomeworkWindow = null;
	});
};

// 为 Tray 对象保存一个全局引用以避免被垃圾回收
let tray;
// 自动云端同步定时器
let autoCloudSyncInterval;
// 每天下午8点自动同步定时器
let eightPMCloudSyncInterval;
const icon = nativeImage.createFromPath(iconPath);

// HTTP服务器，用于接收来自.NET中间件的通知
let httpServer;

// 启动HTTP服务器
function startHttpServer() {
    httpServer = http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url);
        
        if (parsedUrl.pathname === '/notification') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    const notificationData = JSON.parse(body);
                    console.log('Received notification:', notificationData);
                    
                    // 处理不同类型的通知
                    if (notificationData.type === 'classEnded') {
                        // 触发CI作业对话框
                        triggerCiHomeworkDialog();
                    }
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Notification received' }));
                } catch (error) {
                    console.error('Error processing notification:', error);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: 'Invalid notification data' }));
                }
            });
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Not found' }));
        }
    });
    
    httpServer.listen(3000, () => {
        console.log('HTTP server listening on port 3000');
    });
}

// 停止HTTP服务器
function stopHttpServer() {
    if (httpServer) {
        httpServer.close();
        console.log('HTTP server stopped');
    }
}

// 触发CI作业对话框
function triggerCiHomeworkDialog() {
    const config = loadConfig();
    const isCiAutoHomeworkEnabled = config.ciAutoHomeworkEnabled !== undefined ? config.ciAutoHomeworkEnabled : false;
    
    if (isCiAutoHomeworkEnabled) {
        console.log('CI auto homework is enabled, showing subject select dialog');
        showSubjectSelectDialog();
    } else {
        console.log('CI auto homework is disabled, skipping');
    }
}

// 显示科目选择对话框
function showSubjectSelectDialog() {
    const subjectSelectWindow = new BrowserWindow({
        icon: iconPath,
        frame: false,
        width: 500,
        height: 400,
        resizable: false,
        center: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // 加载专门的科目选择页面
    subjectSelectWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>选择科目</title>
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                }
                .container {
                    max-width: 400px;
                    margin: 0 auto;
                }
                h1 {
                    text-align: center;
                    color: #333;
                    margin-bottom: 30px;
                }
                .subject-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                    margin-bottom: 30px;
                }
                .subject-btn {
                    padding: 20px;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    background: white;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                    transition: all 0.2s ease;
                }
                .subject-btn:hover {
                    border-color: #0078d4;
                    background: #f0f8ff;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                .subject-btn.selected {
                    border-color: #0078d4;
                    background: #e6f2ff;
                }
                .actions {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                }
                .btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 6px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .btn-primary {
                    background: #0078d4;
                    color: white;
                }
                .btn-primary:hover {
                    background: #005a9e;
                }
                .btn-secondary {
                    background: #f0f0f0;
                    color: #333;
                }
                .btn-secondary:hover {
                    background: #e0e0e0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>选择科目</h1>
                <div class="subject-grid">
                    <button class="subject-btn" data-subject="chinese">语文</button>
                    <button class="subject-btn" data-subject="math">数学</button>
                    <button class="subject-btn" data-subject="english">英语</button>
                    <button class="subject-btn" data-subject="physics">物理</button>
                    <button class="subject-btn" data-subject="chemistry">化学</button>
                    <button class="subject-btn" data-subject="biology">生物</button>
                    <button class="subject-btn" data-subject="history">历史</button>
                    <button class="subject-btn" data-subject="geography">地理</button>
                    <button class="subject-btn" data-subject="politics">道德与法治</button>
                    <button class="subject-btn" data-subject="other">其他</button>
                </div>
                <div class="actions">
                    <button class="btn btn-secondary" id="cancelBtn">取消</button>
                    <button class="btn btn-primary" id="confirmBtn">确定</button>
                </div>
            </div>
            <script>
                const { ipcRenderer } = require('electron/renderer');
                let selectedSubject = null;
                
                // 绑定科目按钮点击事件
                document.querySelectorAll('.subject-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        // 移除其他按钮的选中状态
                        document.querySelectorAll('.subject-btn').forEach(b => b.classList.remove('selected'));
                        // 添加当前按钮的选中状态
                        this.classList.add('selected');
                        // 保存选中的科目
                        selectedSubject = this.getAttribute('data-subject');
                    });
                });
                
                // 绑定取消按钮点击事件
                document.getElementById('cancelBtn').addEventListener('click', function() {
                    window.close();
                });
                
                // 绑定确定按钮点击事件
                document.getElementById('confirmBtn').addEventListener('click', function() {
                    if (selectedSubject) {
                        // 发送选中的科目到主进程
                        ipcRenderer.send('subject-selected', selectedSubject);
                        window.close();
                    } else {
                        alert('请选择一个科目');
                    }
                });
            </script>
        </body>
        </html>
    `)}`);
    subjectSelectWindow.setMenu(null);

    // 监听科目选择完成事件
    ipcMain.once('subject-selected', (event, subject) => {
        console.log('Selected subject:', subject);
        // 关闭科目选择窗口
        subjectSelectWindow.close();
        // 打开作业编辑窗口，并传递选中的科目
        createHomeworkWindow(null, -1, subject);
    });

    // 窗口关闭时清理引用
    subjectSelectWindow.on('closed', () => {
        // 清理引用
    });
}

// 检查单实例应用
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    // 如果已经有实例在运行，显示提示并退出
    app.quit();
} else {
    // 当第二个实例启动时触发
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        console.log('检测到第二个实例启动');
        
        // 显示提示对话框
        dialog.showMessageBox({
            type: 'info',
            title: '应用已启动',
            message: '课堂窗已经在运行中',
            detail: '应用已最小化到系统托盘，请查看托盘图标进行操作。',
            buttons: ['确定'],
            icon: nativeImage.createFromPath(iconPath)
        });
        
        // 如果主窗口存在，尝试显示它
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

// 自动云端同步相关功能
const checkAutoCloudSyncSettings = () => {
	try {
		const config = loadConfig();
		const settings = config.cloudSyncSettings;
		if (settings && settings.enabled && settings.autoSyncEnabled) {
			console.log('检测到自动云端同步已启用，启动同步服务...');
			startAutoCloudSync();
		} else {
			console.log('自动云端同步未启用或未配置');
		}
	} catch (error) {
		console.error('检查自动云端同步设置失败:', error);
	}
};

const startAutoCloudSync = () => {
	// 清除现有的定时器
	if (autoCloudSyncInterval) {
		clearInterval(autoCloudSyncInterval);
	}
	
	// 设置每5分钟同步一次
	autoCloudSyncInterval = setInterval(() => {
		performAutoCloudSync();
	}, 5 * 60 * 1000); // 5分钟
	
	console.log('自动云端同步已启动，每5分钟执行一次');
};

const stopAutoCloudSync = () => {
	if (autoCloudSyncInterval) {
		clearInterval(autoCloudSyncInterval);
		autoCloudSyncInterval = null;
		console.log('自动云端同步已停止');
	}
	if (eightPMCloudSyncInterval) {
		clearInterval(eightPMCloudSyncInterval);
		eightPMCloudSyncInterval = null;
		console.log('每天下午8点自动同步已停止');
	}
};

const performAutoCloudSync = () => {
	try {
		// 读取云端同步设置
		const config = loadConfig();
		const settings = config.cloudSyncSettings;
		if (!settings) {
			console.log('未找到云端同步设置，跳过自动同步');
			return;
		}
		
		// 检查是否启用了云端同步
		if (!settings.enabled) {
			console.log('云端同步未启用，跳过自动同步');
			return;
		}
		
		// 检查是否有必要的设置
		if (!settings.serverAddress || !settings.schoolCode || !settings.classCode || !settings.teacherPassword) {
			console.log('云端同步设置不完整，跳过自动同步');
			return;
		}
		
		console.log('开始执行自动云端同步...');
		
		// 通知所有打开的窗口执行同步，确保无论哪个窗口打开都能执行
		if (mainWindow && !mainWindow.isDestroyed()) {
			mainWindow.webContents.send('perform-auto-cloud-sync');
		}
		if (settingsWindow && !settingsWindow.isDestroyed()) {
			settingsWindow.webContents.send('perform-auto-cloud-sync');
		}
		
		console.log('自动云端同步执行完成');
	} catch (error) {
		console.error('自动云端同步失败:', error);
	}
};

// 检查是否是每天下午8点
const checkEightPMSync = () => {
	const now = new Date();
	const hours = now.getHours();
	const minutes = now.getMinutes();
	
	// 检查是否是下午8点（20:00）
	if (hours === 20 && minutes === 0) {
		console.log('到达每天下午8点，执行自动云端同步...');
		performAutoCloudSync();
	}
};

// 启动每天下午8点自动同步
const startEightPMAutoSync = () => {
	// 清除现有的定时器
	if (eightPMCloudSyncInterval) {
		clearInterval(eightPMCloudSyncInterval);
	}
	
	// 设置每分钟检查一次当前时间
	eightPMCloudSyncInterval = setInterval(() => {
		checkEightPMSync();
	}, 60 * 1000); // 每分钟检查一次
	
	console.log('每天下午8点自动同步已启动');
};

// 应用准备就绪时
app.whenReady().then(() => {
	// 注册协议处理程序，解决CSS加载问题
	protocol.registerFileProtocol('app', (request, callback) => {
		const url = request.url.replace('app:///', '');
		const filePath = path.join(__dirname, url);
		callback({ path: filePath });
	});

	// 启动HTTP服务器，用于接收来自.NET中间件的通知
	startHttpServer();

	isClockEnabled = clockSettingHandler.load();
	isHomeworkEnabled = homeworkSettingHandler.load();
	isAlwaysOnTop = alwaysOnTopSettingHandler.load(); // 加载置顶设置
	isDarkThemeEnabled = darkThemeSettingHandler.load(); // 加载暗色主题设置

	// 如果是首次运行，显示欢迎页；否则直接创建主窗口
	const appConfig = loadConfig();

	// 接收欢迎页完成信号：保存首次运行标记并创建主窗口
	ipcMain.on('first-run-complete', () => {
		try {
			const cfg = loadConfig();
			cfg.firstRun = false;
			saveConfig(cfg);
		} catch (e) {
			console.warn('设置首次运行标记失败:', e);
		}

		// 创建主窗口并关闭欢迎页
		createWindow();
		if (welcomeWindow) {
			welcomeWindow.close();
			welcomeWindow = null;
		}
	});

	if (appConfig.firstRun === undefined || appConfig.firstRun) {
		createWelcomeWindow();
	} else {
		// 检查是否需要显示新手引导
		// 注意：这里使用localStorage来检查新手引导状态，因为新手引导是在渲染进程中完成的
		// 在主进程中我们无法直接访问localStorage，所以需要在渲染进程中完成检查
		// 我们先创建主窗口，然后在主窗口的渲染进程中检查是否需要显示新手引导
		createWindow();
		// 检查自动云端同步设置
		checkAutoCloudSyncSettings();
		// 如果当前主题是大屏模式，隐藏主窗口并显示大屏作业窗口
		if (currentTheme === 'big-screen') {
			if (mainWindow && !mainWindow.isDestroyed()) {
				mainWindow.hide();
			}
			createBigScreenHomeworkWindow();
		} else {
			// 如果大屏作业窗口存在，关闭它
			if (bigScreenHomeworkWindow && !bigScreenHomeworkWindow.isDestroyed()) {
				bigScreenHomeworkWindow.close();
				bigScreenHomeworkWindow = null;
			}
			
			// 如果主窗口存在，显示它
			if (mainWindow && !mainWindow.isDestroyed()) {
				mainWindow.show();
			}
		}
	}

	tray = new Tray(icon);

	// 设置托盘图标tooltip
	tray.setToolTip('课堂窗 - ClassWindow plus');

	const contextMenu = Menu.buildFromTemplate([{
			label: '课堂窗 - ClassWindow plus',
			role: "about"
		},
		{
			label: '设置',
			click: () => {
				createSettingsWindow();
			}
		},
		{
			label: '添加作业',
			click: () => {
				createHomeworkWindow();
			}
		},
		{
			label: '查看作业列表',
			click: () => {
				createHomeworkListWindow();
			}
		},
		{
			label: '重新加载页面',
			role: "forceReload"
		},
		{
			label: '关于',
			click: () => {
				createSettingsWindow();
				// 当设置窗口加载完成后，切换到about标签
				settingsWindow.webContents.on('did-finish-load', () => {
					settingsWindow.webContents.executeJavaScript(`
						// 模拟点击about标签
						document.querySelector('.nav-item[data-tab="about"]').click();
					`);
				});
			}
		},
		{
			label: '新手引导',
			click: () => {
				createWelcomeWindow();
			}
		},
		{
			label: '退出',
			role: "quit"
		},
	]);

	tray.setContextMenu(contextMenu);
	
	// 添加托盘点击事件
	tray.on('click', () => {
		// 点击托盘图标时，可以显示或隐藏主窗口
		if (mainWindow && !mainWindow.isDestroyed()) {
			if (mainWindow.isVisible()) {
				mainWindow.hide();
			} else {
				mainWindow.show();
			}
		} else {
			// 如果主窗口不存在，创建一个新的
			createWindow();
		}
	});

	ipcMain.on('set-ignore-mouse-events', (event, {
		ignore,
		forward
	}) => {
		const win = BrowserWindow.fromWebContents(event.sender);
		if (win) {
			win.setIgnoreMouseEvents(ignore, forward ? {
				forward: true
			} : undefined);
		}
	});

	ipcMain.on('open-settings-window', () => {
		createSettingsWindow();
	});

	// 监听打开作业窗口的请求
	ipcMain.on('open-homework-window', () => {
		if (isHomeworkEnabled) { // 只有时作业功能启用时才打开窗口
			createHomeworkWindow();
		}
	});

	// 监听保存作业的请求
ipcMain.on('save-homework', (event, homework) => {
    // 将作业数据发送回主窗口
    if (mainWindow) {
        mainWindow.webContents.send('new-homework', homework);
    }
    
    // 通知作业列表窗口刷新
    if (homeworkListWindow) {
        homeworkListWindow.webContents.send('refresh-homework-list');
    }
    
    // 触发自动云端同步
    console.log('作业保存完成，触发自动云端同步...');
    performAutoCloudSync();
    
    // 移除直接通知大屏作业窗口的代码，改为由主窗口在完成数据保存后通知
    // 这样可以确保数据已经保存到localStorage后再刷新大屏作业窗口
    // if (bigScreenHomeworkWindow) {
    //     bigScreenHomeworkWindow.webContents.send('refresh-homework-list');
    // }
});

// 监听更新作业的请求
ipcMain.on('update-homework', (event, homework, index) => {
    // 发送更新作业请求到主窗口
    if (mainWindow) {
        mainWindow.webContents.send('update-homework', homework, index);
    }
    
    // 通知作业列表窗口刷新
    if (homeworkListWindow) {
        homeworkListWindow.webContents.send('refresh-homework-list');
    }
    
    // 通知大屏作业窗口更新
    if (bigScreenHomeworkWindow) {
        // 大屏作业窗口会从本地存储读取数据，不需要在这里传递
        bigScreenHomeworkWindow.webContents.send('refresh-homework-list');
    }
});

// 监听作业删除事件
	ipcMain.on('homework-deleted', (event, homeworkId) => {
		// 通知主窗口作业已删除，更新作业列表
		if (mainWindow) {
			mainWindow.webContents.send('homework-deleted', homeworkId);
		}
		
		// 通知大屏作业窗口更新
		if (bigScreenHomeworkWindow) {
			// 大屏作业窗口会从本地存储读取数据，不需要在这里传递
			bigScreenHomeworkWindow.webContents.send('refresh-homework-list');
		}
	});
	
	// 监听主窗口作业更新完成事件，确保数据已经保存到localStorage
	ipcMain.on('main-window-homework-updated', (event) => {
		// 通知大屏作业窗口刷新，确保数据已经保存到localStorage
		if (bigScreenHomeworkWindow) {
			bigScreenHomeworkWindow.webContents.send('refresh-homework-list');
		}
	});

	// 监听作业窗口关闭事件
	ipcMain.on('homework-window-closed', () => {
		homeworkWindow = null;
	});

	// 监听获取设置的请求
ipcMain.on('get-settings', () => {
	if (settingsWindow) {
		const config = loadConfig();
		settingsWindow.webContents.send('settings-updated', {
			startupEnabled: isStartupEnabled, // 添加开机自启动状态
			ciAutoHomeworkEnabled: isCiAutoHomeworkEnabled, // 添加CI自动作业状态
			windowBlur: config.windowBlur || 10,
			bigScreenBlur: config.bigScreenBlur || 10,
			bigScreenColumns: config.bigScreenColumns || '2',
			bigScreenFontSize: config.bigScreenFontSize || 14,
			bigScreenOpacity: config.bigScreenOpacity || 95,
			bigScreenWindow: config.bigScreenWindow || { width: 1920, height: 1080 },
			windowPosition: config.windowPosition || 'center',
			windowOffset: config.windowOffset || { x: 0, y: 0 },
			mainInterfaceScale: config.mainInterfaceScale || 100,
			
			theme: currentTheme, // 添加主题设置
			launchpadApps: getLaunchpadApps()
		});
	}
});
// 监听打开自启动文件夹请求
ipcMain.on('open-startup-folder', (event) => {
    console.log('打开自启动文件夹请求');
    
    try {
        // 获取自启动文件夹路径
        const startupFolder = getStartupFolderPath();
        
        if (startupFolder) {
            // 确保文件夹存在
            if (!fs.existsSync(startupFolder)) {
                fs.mkdirSync(startupFolder, { recursive: true });
            }
            
            // 打开文件夹
            shell.openPath(startupFolder).then((result) => {
                if (result) {
                    console.error('打开自启动文件夹失败:', result);
                } else {
                    console.log('成功打开自启动文件夹:', startupFolder);
                }
            });
        } else {
            console.error('无法获取自启动文件夹路径');
        }
    } catch (error) {
        console.error('打开自启动文件夹失败:', error);
    }
});
	// 监听时钟开关变化
	ipcMain.on('toggle-clock', (event, isEnabled) => {
		handleClockToggle(isEnabled);
	});

	// 监听作业开关变化
	ipcMain.on('toggle-homework', (event, isEnabled) => {
		handleHomeworkToggle(isEnabled);
	});

	// 监听置顶开关变化
	ipcMain.on('toggle-always-on-top', (event, isEnabled) => {
		handleAlwaysOnTopToggle(isEnabled);
	});

	// 监听暗色主题开关变化
	ipcMain.on('toggle-dark-theme', (event, isEnabled) => {
		handleDarkThemeToggle(isEnabled);
	});

	// 监听主题选择变化
	ipcMain.on('set-theme', (event, theme) => {
		handleThemeChange(theme);
	});

	// 监听开机自启动开关变化
ipcMain.on('toggle-startup', (event, isEnabled) => {
	handleStartupToggle(isEnabled);
});

// 监听CI自动作业开关变化
ipcMain.on('toggle-ci-auto-homework', (event, isEnabled) => {
	handleCiAutoHomeworkToggle(isEnabled);
});

// 监听测试CI联动事件
ipcMain.on('test-ci-integration', (event) => {
	console.log('Test CI integration event received');
	// 触发CI作业对话框，模拟ClassIsland课程结束事件
	triggerCiHomeworkDialog();
});

	// 监听大屏作业窗口关闭事件
	ipcMain.on('close-big-screen-homework', () => {
		if (bigScreenHomeworkWindow) {
			bigScreenHomeworkWindow.close();
			bigScreenHomeworkWindow = null;
			// 将主题切换回个人模式
			handleThemeChange('personal');
		}
	});

	// 监听添加启动台应用
	ipcMain.on('add-launchpad-app', (event, app) => {
		const updatedApps = addLaunchpadApp(app);
		if (updatedApps) {
			// 通知所有窗口更新启动台应用列表
			if (mainWindow) {
				mainWindow.webContents.send('launchpad-apps-updated', updatedApps);
			}
			if (settingsWindow) {
				settingsWindow.webContents.send('launchpad-apps-updated', updatedApps);
			}
		}
	});

	// 监听删除启动台应用
	ipcMain.on('remove-launchpad-app', (event, index) => {
		const updatedApps = removeLaunchpadApp(index);
		if (updatedApps !== null) {
			// 通知所有窗口更新启动台应用列表
			if (mainWindow) {
				mainWindow.webContents.send('launchpad-apps-updated', updatedApps);
			}
			if (settingsWindow) {
				settingsWindow.webContents.send('launchpad-apps-updated', updatedApps);
			}
		}
	});

	// 监听启动应用请求
	ipcMain.on('launch-app', (event, app) => {
		launchAppOrLink(app);
	});

	ipcMain.on('open-homework-list-window', () => {
		createHomeworkListWindow();
	});

	// 监听打开模板设计器窗口的请求
	ipcMain.on('open-template-designer-window', () => {
		createTemplateDesignerWindow();
	});

	// 监听打开账号管理窗口的请求
	ipcMain.on('open-account-management-window', () => {
		createAccountWindow();
	});

	// 监听模板设计器窗口关闭事件
ipcMain.on('template-designer-window-closed', () => {
    templateDesignerWindow = null;
});

// 监听模板更新事件
ipcMain.on('template-updated', () => {
    // 广播给所有窗口，包括添加作业窗口
    if (homeworkWindow) {
        homeworkWindow.webContents.send('template-updated');
    }
});

	// 监听作业列表窗口关闭事件
	ipcMain.on('homework-list-window-closed', () => {
		homeworkListWindow = null;
	});

	// 监听打开作业详情窗口的请求
	ipcMain.on('open-homework-detail-window', (event, homework, index) => {
		createHomeworkDetailWindow(homework, index);
	});

	// 监听作业详情窗口关闭事件
ipcMain.on('homework-detail-window-closed', () => {
	homeworkDetailWindow = null;
});

	// 监听编辑作业事件
	ipcMain.on('edit-homework', (event, homework, index) => {
		// 打开作业添加窗口并传入数据进行编辑
		createHomeworkWindow(homework, index);
	});

	// 监听打开作业编辑窗口的请求
	ipcMain.on('open-homework-edit-window', (event, homework) => {
		// 打开作业添加窗口并传入数据进行编辑
		createHomeworkWindow(homework);
	});

	// 监听窗口背景模糊设置变化
ipcMain.on('set-window-blur', (event, blurValue) => {
	const config = loadConfig();
	config.windowBlur = blurValue;
	saveConfig(config);
	
	// 通知主窗口更新模糊效果
	if (mainWindow) {
		mainWindow.webContents.send('update-window-blur', blurValue);
	}
});

// 监听大屏模式背景模糊设置变化
ipcMain.on('set-big-screen-blur', (event, blurValue) => {
	const config = loadConfig();
	config.bigScreenBlur = blurValue;
	saveConfig(config);
	
	// 通知大屏作业窗口更新模糊效果
	if (bigScreenHomeworkWindow) {
		bigScreenHomeworkWindow.webContents.send('update-big-screen-blur', blurValue);
	}
});

// 监听大屏模式列数设置变化
ipcMain.on('set-big-screen-columns', (event, columns) => {
	const config = loadConfig();
	config.bigScreenColumns = columns;
	saveConfig(config);
	
	// 通知大屏作业窗口更新列数
	if (bigScreenHomeworkWindow) {
		bigScreenHomeworkWindow.webContents.send('update-big-screen-columns', columns);
	}
});

// 监听大屏模式字号设置变化
ipcMain.on('set-big-screen-font-size', (event, fontSize) => {
	const config = loadConfig();
	config.bigScreenFontSize = fontSize;
	saveConfig(config);
	
	// 通知大屏作业窗口更新字号
	if (bigScreenHomeworkWindow) {
		bigScreenHomeworkWindow.webContents.send('update-big-screen-font-size', fontSize);
	}
});

// 监听大屏模式不透明度设置变化
ipcMain.on('set-big-screen-opacity', (event, opacity) => {
	const config = loadConfig();
	config.bigScreenOpacity = opacity;
	saveConfig(config);
	
	// 通知大屏作业窗口更新不透明度
	if (bigScreenHomeworkWindow) {
		bigScreenHomeworkWindow.webContents.send('update-big-screen-opacity', opacity);
	}
});

// 监听大屏模式宽度设置变化
ipcMain.on('set-big-screen-width', (event, width) => {
	const config = loadConfig();
	// 更新配置中的宽度设置
	if (!config.bigScreenWindow) {
		config.bigScreenWindow = {};
	}
	config.bigScreenWindow.width = width;
	saveConfig(config);
	
	// 如果大屏作业窗口存在，调整其宽度
	if (bigScreenHomeworkWindow && !bigScreenHomeworkWindow.isDestroyed()) {
		const [currentWidth, currentHeight] = bigScreenHomeworkWindow.getSize();
		bigScreenHomeworkWindow.setSize(width, currentHeight);
	}
});

// 监听大屏模式高度设置变化
ipcMain.on('set-big-screen-height', (event, height) => {
	const config = loadConfig();
	// 更新配置中的高度设置
	if (!config.bigScreenWindow) {
		config.bigScreenWindow = {};
	}
	config.bigScreenWindow.height = height;
	saveConfig(config);
	
	// 如果大屏作业窗口存在，调整其高度
	if (bigScreenHomeworkWindow && !bigScreenHomeworkWindow.isDestroyed()) {
		const [currentWidth, currentHeight] = bigScreenHomeworkWindow.getSize();
		bigScreenHomeworkWindow.setSize(currentWidth, height);
	}
});

// 监听获取大屏设置请求
ipcMain.on('get-big-screen-settings', (event) => {
	const config = loadConfig();
	// 获取发送请求的窗口
	const senderWindow = BrowserWindow.fromWebContents(event.sender);
	if (senderWindow) {
		senderWindow.webContents.send('big-screen-settings', {
			columns: config.bigScreenColumns || '2',
			fontSize: config.bigScreenFontSize || 14,
			opacity: config.bigScreenOpacity || 95,
			blur: config.bigScreenBlur || 10,
			width: config.bigScreenWindow?.width || 1920,
			height: config.bigScreenWindow?.height || 1080
		});
	}
});

// 监听获取窗口位置请求
ipcMain.on('get-window-position', (event) => {
	const senderWindow = BrowserWindow.fromWebContents(event.sender);
	if (senderWindow) {
		const position = senderWindow.getPosition();
		senderWindow.webContents.send('window-position', {
			x: position[0],
			y: position[1]
		});
	}
});

// 监听移动大屏窗口请求
ipcMain.on('move-big-screen-window', (event, x, y) => {
	const senderWindow = BrowserWindow.fromWebContents(event.sender);
	if (senderWindow) {
		senderWindow.setPosition(Math.round(x), Math.round(y), false);
	}
});

// 监听相对移动大屏窗口请求（优化性能）
ipcMain.on('move-big-screen-window-by-delta', (event, deltaX, deltaY) => {
	const senderWindow = BrowserWindow.fromWebContents(event.sender);
	if (senderWindow) {
		const [currentX, currentY] = senderWindow.getPosition();
		const newX = Math.round(currentX + deltaX);
		const newY = Math.round(currentY + deltaY);
		senderWindow.setPosition(newX, newY, false);
	}
});

// 监听保存大屏窗口位置请求
ipcMain.on('save-big-screen-position', (event) => {
	const senderWindow = BrowserWindow.fromWebContents(event.sender);
	if (senderWindow) {
		try {
			const [x, y] = senderWindow.getPosition();
			const config = loadConfig();
			if (!config.bigScreenWindow) {
				config.bigScreenWindow = {};
			}
			config.bigScreenWindow.x = x;
			config.bigScreenWindow.y = y;
			saveConfig(config);
			console.log('保存大屏窗口位置:', { x, y });
		} catch (error) {
			console.error('保存大屏窗口位置失败:', error);
		}
	}
});

// 监听获取作业数据请求
ipcMain.on('get-homework-data', (event) => {
	// 从localStorage读取作业数据
	let homeworkData = [];
	const originalSender = event.sender; // 保存原始事件发送者
	
	try {
		// 从主窗口的localStorage读取作业数据
		// 由于主进程无法直接访问localStorage，我们需要从配置文件中读取
		// 或者让渲染进程直接从localStorage读取
		
		// 检查是否有主窗口存在
		if (mainWindow && !mainWindow.isDestroyed()) {
			// 发送请求到主窗口，让主窗口从localStorage读取数据
			mainWindow.webContents.send('get-homework-from-localstorage');
			
			// 等待主窗口的响应
			const handleHomeworkData = (event, data) => {
				homeworkData = data || [];
				
				// 发送响应，使用原始事件发送者
				if (!originalSender.isDestroyed()) {
					originalSender.send('homework-data', homeworkData);
				}
				
				// 移除事件监听器
				ipcMain.removeListener('homework-data-from-localstorage', handleHomeworkData);
			};
			
			// 添加事件监听器
			ipcMain.on('homework-data-from-localstorage', handleHomeworkData);
			
			// 超时处理
			setTimeout(() => {
				// 移除事件监听器
				ipcMain.removeListener('homework-data-from-localstorage', handleHomeworkData);
				
				// 发送响应，使用原始事件发送者
				if (!originalSender.isDestroyed()) {
					originalSender.send('homework-data', homeworkData);
				}
			}, 5000);
		} else {
			// 如果主窗口不存在，使用空数组
			homeworkData = [];
			
			// 发送响应，使用原始事件发送者
			if (!originalSender.isDestroyed()) {
				originalSender.send('homework-data', homeworkData);
			}
		}
	} catch (error) {
		console.error('读取作业数据失败:', error);
		
		// 发送响应，使用原始事件发送者
		if (!originalSender.isDestroyed()) {
			originalSender.send('homework-data', homeworkData);
		}
	}
});

// 监听开始调整大小事件
ipcMain.on('start-resizing', (event, edge) => {
	const senderWindow = BrowserWindow.fromWebContents(event.sender);
	if (senderWindow) {
		// 设置窗口为可调整大小
		senderWindow.setResizable(true);
		// 确保窗口可以调整大小，包括缩小
		senderWindow.setMinimumSize(200, 150);
	}
});

// 监听停止调整大小事件
ipcMain.on('stop-resizing', (event) => {
	const senderWindow = BrowserWindow.fromWebContents(event.sender);
	if (senderWindow) {
		// 保存窗口大小和位置
		try {
			const [width, height] = senderWindow.getSize();
			const [x, y] = senderWindow.getPosition();
			const config = loadConfig();
			
			// 检查发送事件的窗口是个人模式窗口还是大屏模式窗口
			if (senderWindow === mainWindow) {
				// 个人模式窗口，只更新位置，不更新大小
			if (config.windowPosition === undefined || config.windowPosition === null) {
				saveCurrentWindowPosition(x, y);
			}
			} else if (senderWindow === bigScreenHomeworkWindow) {
				// 大屏模式窗口，更新大小和位置
				config.bigScreenWindow = {
					width,
					height,
					x,
					y
				};
			}
			
			saveConfig(config);
		} catch (error) {
			console.error('保存窗口大小和位置失败:', error);
		}
		// 保持窗口为可调整大小状态，以便下次操作
		senderWindow.setResizable(true);
	}
});

// 监听调整大屏窗口大小事件
ipcMain.on('resize-big-screen-window', (event, { edge, deltaX, deltaY }) => {
	const senderWindow = BrowserWindow.fromWebContents(event.sender);
	if (senderWindow) {
		const [currentWidth, currentHeight] = senderWindow.getSize();
		const [currentX, currentY] = senderWindow.getPosition();
		let newWidth = currentWidth;
		let newHeight = currentHeight;
		let newX = currentX;
		let newY = currentY;
		
		// 根据调整边缘计算新的窗口大小和位置
		switch (edge) {
			case 'top':
				newHeight = Math.max(150, currentHeight - deltaY);
				newY = currentY + deltaY;
				break;
			case 'bottom':
				newHeight = Math.max(150, currentHeight + deltaY);
				break;
			case 'left':
				newWidth = Math.max(200, currentWidth - deltaX);
				newX = currentX + deltaX;
				break;
			case 'right':
				newWidth = Math.max(200, currentWidth + deltaX);
				break;
			case 'top-left':
				newWidth = Math.max(200, currentWidth - deltaX);
				newHeight = Math.max(150, currentHeight - deltaY);
				newX = currentX + deltaX;
				newY = currentY + deltaY;
				break;
			case 'top-right':
				newWidth = Math.max(200, currentWidth + deltaX);
				newHeight = Math.max(150, currentHeight - deltaY);
				newY = currentY + deltaY;
				break;
			case 'bottom-left':
				newWidth = Math.max(200, currentWidth - deltaX);
				newHeight = Math.max(150, currentHeight + deltaY);
				newX = currentX + deltaX;
				break;
			case 'bottom-right':
				newWidth = Math.max(200, currentWidth + deltaX);
				newHeight = Math.max(150, currentHeight + deltaY);
				break;
		}
		
		// 设置新的窗口大小和位置
		senderWindow.setBounds({
			x: newX,
			y: newY,
			width: newWidth,
			height: newHeight
		});
	}
});

	// 监听窗口位置设置变化
ipcMain.on('set-window-position', (event, position) => {
	const config = loadConfig();
	config.windowPosition = position;
	saveConfig(config);
	
	// 立即应用位置设置到主窗口
	if (mainWindow) {
		const [x, y] = getWindowPosition();
		mainWindow.setPosition(x, y, false);
	}
});

// 监听窗口移动事件
ipcMain.on('move-window', (event, deltaX, deltaY) => {
	if (mainWindow) {
		const [currentX, currentY] = mainWindow.getPosition();
		mainWindow.setPosition(currentX + deltaX, currentY + deltaY, false);
	}
});

// 监听窗口偏移设置变化
ipcMain.on('set-window-offset', (event, offset) => {
	const config = loadConfig();
	config.windowOffset = {
		x: offset.x,
		y: offset.y
	};
	saveConfig(config);
	
	// 立即应用偏移设置到主窗口
	if (mainWindow) {
		const [x, y] = getWindowPosition();
		mainWindow.setPosition(x, y, false);
	}
});

// 监听获取当前模糊设置的请求
ipcMain.on('get-current-blur', (event) => {
	const config = loadConfig();
	const blurValue = config.windowBlur || 10;
	// 发送当前模糊值给主窗口
	if (mainWindow) {
		mainWindow.webContents.send('update-window-blur', blurValue);
	}
});

// 监听获取当前缩放设置的请求
ipcMain.on('get-current-scale', (event) => {
	const config = loadConfig();
	const scale = config.mainInterfaceScale || 100;
	// 发送当前缩放值给主窗口
	if (mainWindow) {
		mainWindow.webContents.send('update-main-interface-scale', scale);
	}
});
// 监听重启应用请求
ipcMain.on('restart-app', () => {
	app.relaunch();
	app.exit();
});

// 监听自动云端同步设置更新
ipcMain.on('update-auto-cloud-sync', (event, enabled) => {
	if (enabled) {
		startAutoCloudSync();
	} else {
		stopAutoCloudSync();
	}
});

// 监听执行自动云端同步的请求
ipcMain.on('perform-auto-cloud-sync', () => {
	performAutoCloudSync();
});
// 监听窗口大小调整请求
ipcMain.on('adjust-window-size', () => {
	if (mainWindow) {
		// 执行JavaScript获取缩放后的实际内容尺寸，添加错误处理
		mainWindow.webContents.executeJavaScript(`
	try {
		// 获取内容容器
		const contentContainer = document.querySelector('.content');
		if (contentContainer) {
			// 移除所有限制，让内容自然扩展
			contentContainer.style.maxHeight = 'none';
			contentContainer.style.overflow = 'visible';
			
			// 获取主容器
			const mainContainer = document.getElementById('mainContainer');
			if (mainContainer) {
				mainContainer.style.overflow = 'visible';
			}
			
			// 获取内容大小
			const rect = contentContainer.getBoundingClientRect();
			const requiredWidth = rect.width + 20;
			const requiredHeight = rect.height + 50;
			
			return { width: requiredWidth, height: requiredHeight };
		}
		return { width: 300, height: 600 };
	} catch (e) {
		console.error('获取容器尺寸失败:', e);
		return { width: 300, height: 600 };
	}
	`).then((size) => {
		// 调整窗口大小以适应内容，添加最小高度
		const minHeight = 400;
		const finalHeight = Math.max(size.height, minHeight);
		mainWindow.setSize(size.width, finalHeight, true);
	}).catch((error) => {
		console.error('执行JavaScript失败:', error);
	});
	}
});



	// 监听作业面板缩放设置变化
ipcMain.on('set-homework-scale', (event, scale) => {
	const config = loadConfig();
	config.homeworkScale = scale;
	saveConfig(config);
	
	// 如果作业添加窗口已经打开，立即更新其大小
	if (homeworkWindow) {
		// 获取屏幕尺寸
		const { width, height } = screen.getPrimaryDisplay().workAreaSize;
		// 设置基础窗口尺寸
		let baseWidth = 1000;
		let baseHeight = 700;
		// 根据新的缩放比例调整窗口尺寸
		const newWidth = Math.round(baseWidth * scale / 100);
		const newHeight = Math.round(baseHeight * scale / 100);
		
		// 重新计算窗口位置，保持窗口中心位置不变
		const [currentX, currentY] = homeworkWindow.getPosition();
		const [currentWidth, currentHeight] = homeworkWindow.getSize();
		const newX = currentX + (currentWidth - newWidth) / 2;
		const newY = currentY + (currentHeight - newHeight) / 2;
		
		// 更新窗口大小和位置
		homeworkWindow.setSize(newWidth, newHeight, true);
		homeworkWindow.setPosition(Math.round(newX), Math.round(newY), true);
	}
	
	// 如果作业列表窗口已经打开，立即更新其大小
	if (homeworkListWindow) {
		// 获取屏幕尺寸
		const { width, height } = screen.getPrimaryDisplay().workAreaSize;
		// 设置基础窗口尺寸
		let baseWidth = 800;
		let baseHeight = 600;
		// 根据新的缩放比例调整窗口尺寸
		const newWidth = Math.round(baseWidth * scale / 100);
		const newHeight = Math.round(baseHeight * scale / 100);
		
		// 重新计算窗口位置，保持窗口中心位置不变
		const [currentX, currentY] = homeworkListWindow.getPosition();
		const [currentWidth, currentHeight] = homeworkListWindow.getSize();
		const newX = currentX + (currentWidth - newWidth) / 2;
		const newY = currentY + (currentHeight - newHeight) / 2;
		
		// 更新窗口大小和位置
		homeworkListWindow.setSize(newWidth, newHeight, true);
		homeworkListWindow.setPosition(Math.round(newX), Math.round(newY), true);
	}
});

// 监听主界面组件缩放设置变化
ipcMain.on('set-main-interface-scale', (event, scale) => {
	const config = loadConfig();
	config.mainInterfaceScale = scale;
	saveConfig(config);
	
	// 如果主窗口已经打开，立即更新其内容缩放
	if (mainWindow) {
		// 发送缩放比例到渲染进程，用于调整组件内容大小
		mainWindow.webContents.send('update-main-interface-scale', scale);
		
		// 延迟调整窗口大小，确保内容已缩放完成
		setTimeout(() => {
			// 使用简单的方式调整窗口大小，根据缩放比例增加高度
			const currentWidth = mainWindow.getSize()[0];
			// 根据缩放比例动态计算高度
			const newHeight = Math.round(800 * (scale / 100));
			mainWindow.setSize(currentWidth, newHeight, true);
		}, 200); // 增加延迟，确保内容完全渲染
	}
});



	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});

	app.on('window-all-closed', () => {
	// 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
	// 否则绝大部分应用及其菜单栏会保持激活。
	if (process.platform !== 'darwin') {
		// 停止HTTP服务器
		stopHttpServer();
		app.quit();
	}
});

	// 检查并初始化自动云端同步
	checkAutoCloudSyncSettings();
	// 启动每天下午8点自动同步
	startEightPMAutoSync();
}); // 闭合 app.whenReady().then() 回调函数