const {
	app,
	BrowserWindow,
	screen,
	ipcMain,
	Tray,
	Menu
} = require('electron/main');
const path = require('path');
const {
	nativeImage
} = require('electron/common');

// 配置模块
const {
	initConfigPath,
	loadConfig,
	saveConfig,
	createSettingHandler,
} = require('./config');

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

if (app.isPackaged) {
	iconPath = path.join(resourcesRoot, "assets/logo.png");
} else {
	iconPath = path.join(__dirname, "assets/logo.png");
}

// 根据配置获取窗口位置
const getWindowPosition = () => {
	const config = loadConfig();
	const { width, height } = screen.getPrimaryDisplay().workAreaSize;
	const windowPosition = config.windowPosition || 'top-right';
	const winWidth = 300;
	const winHeight = 300; // 估计值，实际会由窗口内容决定
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
const loadWindowPosition = () => {
	const config = loadConfig();
	if (config.window?.x !== undefined && config.window?.y !== undefined && !config.windowPosition) {
		return [config.window.x, config.window.y];
	}
	return getWindowPosition();
};

const saveWindowPosition = (x, y) => {
	const config = loadConfig();
	config.window = {
		x,
		y
	};
	saveConfig(config);
};

// 主窗口
let mainWindow;

const createWindow = () => {
	const [defaultX, defaultY] = loadWindowPosition();

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
		// 设置窗口层级为桌面窗口
		type: 'desktop',
		// 背景透明
		transparent: true,
		// 可调整大小
		resizable: true,
		// 不显示在任务栏
		skipTaskbar: true,
		// 焦点丢失时是否隐藏窗口
		focusable: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			preload: path.join(__dirname, 'assets/js/main.js')
		}
	});
	
	// 监听窗口内容加载完成事件，调整窗口大小以适应内容
	mainWindow.webContents.on('did-finish-load', () => {
		// 延迟调整，确保DOM已完全渲染
		setTimeout(() => {
			// 执行JavaScript获取容器尺寸，添加错误处理
			mainWindow.webContents.executeJavaScript(`
			
try {
				const contentContainer = document.querySelector('.content');
				if (contentContainer) {
					// 移除内容容器的最大高度限制
					contentContainer.style.maxHeight = 'none';
					const rect = contentContainer.getBoundingClientRect();
					// 计算所需的窗口高度，添加额外边距
					const requiredHeight = rect.height + 50;
					return { width: rect.width, height: requiredHeight };
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
		// 只有当位置设置为自定义时才保存位置
		const config = loadConfig();
		if (config.windowPosition === undefined || config.windowPosition === null) {
			const [x, y] = mainWindow.getPosition();
			saveWindowPosition(x, y);
		}
	});

	// 监听窗口关闭事件，保存位置
	mainWindow.on('close', () => {
		// 只有当位置设置为自定义时才保存位置
		const config = loadConfig();
		if (config.windowPosition === undefined || config.windowPosition === null) {
			const [x, y] = mainWindow.getPosition();
			saveWindowPosition(x, y);
		}
	});

	return mainWindow;
};

// 作业添加窗口
let homeworkWindow;

const createHomeworkWindow = () => {
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
	let baseWidth = 1000;
	let baseHeight = 700;
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

let isClockEnabled = clockSettingHandler.load();
let isHomeworkEnabled = homeworkSettingHandler.load();
let isAlwaysOnTop = alwaysOnTopSettingHandler.load(); // 添加置顶状态变量
let isDarkThemeEnabled = darkThemeSettingHandler.load(); // 添加暗色主题状态变量

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
};

// 为 Tray 对象保存一个全局引用以避免被垃圾回收
let tray;
const icon = nativeImage.createFromPath(iconPath);

// 应用准备就绪时
app.whenReady().then(() => {
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
		createWindow();
	}

	tray = new Tray(icon);

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
			label: '查看作业列表',
			click: () => {
				createHomeworkListWindow();
			}
		},
		{
			label: '退出',
			role: "quit"
		},
	]);

	tray.setContextMenu(contextMenu);

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
			clockEnabled: isClockEnabled,
			homeworkEnabled: isHomeworkEnabled,
			alwaysOnTop: isAlwaysOnTop, // 添加置顶状态
			darkThemeEnabled: isDarkThemeEnabled, // 添加暗色主题状态
			windowBlur: config.windowBlur || 10,
			windowPosition: config.windowPosition || 'center',
			windowOffset: config.windowOffset || { x: 0, y: 0 },
			mainInterfaceScale: config.mainInterfaceScale || 100,
			launchpadApps: getLaunchpadApps()
		});
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

	// 监听模板设计器窗口关闭事件
	ipcMain.on('template-designer-window-closed', () => {
		templateDesignerWindow = null;
	});

	// 监听作业列表窗口关闭事件
	ipcMain.on('homework-list-window-closed', () => {
		homeworkListWindow = null;
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

// 监听窗口大小调整请求
ipcMain.on('adjust-window-size', () => {
	if (mainWindow) {
		// 执行JavaScript获取缩放后的实际内容尺寸，添加错误处理
		mainWindow.webContents.executeJavaScript(`
		try {
			const mainContainer = document.getElementById('mainContainer');
			const contentContainer = document.querySelector('.content');
			if (mainContainer && contentContainer) {
				// 移除所有限制，让内容自然扩展
				contentContainer.style.maxHeight = 'none';
				contentContainer.style.overflow = 'visible';
				mainContainer.style.overflow = 'visible';
				
				// 获取transform属性，计算缩放比例
				const transform = getComputedStyle(mainContainer).transform;
				let scaleFactor = 1;
				if (transform !== 'none') {
					const matrix = new DOMMatrix(transform);
					scaleFactor = matrix.a; // 缩放比例
				}
				
				// 获取原始内容大小
				const originalWidth = contentContainer.offsetWidth;
				const originalHeight = contentContainer.offsetHeight;
				
				// 计算缩放后的实际尺寸
				const scaledWidth = originalWidth * scaleFactor;
				const scaledHeight = originalHeight * scaleFactor;
				
				// 添加额外边距
				const requiredWidth = scaledWidth + 20;
				const requiredHeight = scaledHeight + 50;
				
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
	
	// 如果主窗口已经打开，立即更新其大小和内容缩放
	if (mainWindow) {
		// 发送缩放比例到渲染进程，用于调整组件内容大小
		mainWindow.webContents.send('update-main-interface-scale', scale);
		
		// 延迟调整窗口大小，确保内容已缩放完成
		setTimeout(() => {
			// 执行JavaScript获取缩放后的实际内容尺寸，添加错误处理
			mainWindow.webContents.executeJavaScript(`
			try {
				const contentContainer = document.querySelector('.content');
				if (contentContainer) {
					// 移除内容容器的最大高度限制
					contentContainer.style.maxHeight = 'none';
					const rect = contentContainer.getBoundingClientRect();
					// 计算所需的窗口高度，添加额外边距
					const requiredHeight = rect.height + 50;
					return { width: rect.width, height: requiredHeight };
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
			app.quit();
		}
	});
}); // 闭合 app.whenReady().then() 回调函数