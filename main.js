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

// 作业数据管理
const {
	initHomeworkPath,
	loadHomework,
	addHomework,
	deleteHomework,
	updateHomework,
	loadTemplates,
	saveTemplates,
	addTemplate,
	deleteTemplate,
	getAllTemplates
} = require('./homework');

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

// 初始化作业数据路径
initHomeworkPath();

if (app.isPackaged) {
	iconPath = path.join(resourcesRoot, "assets/logo.png");
} else {
	iconPath = path.join(__dirname, "assets/logo.png");
}

// 读取/保存窗口位置和大小
const loadWindowSize = (windowType) => {
	const config = loadConfig();
	
	// 默认尺寸
	const defaultSizes = {
		clockWindow: { width: 300, height: 150 },
		homeworkWindow: { width: 300, height: 300 },
		launchpadWindow: { width: 300, height: 200 },
		homeworkAddWindow: { width: 400, height: 300 },
		homeworkListWindow: { width: 800, height: 600 },
		settingsWindow: { width: 700, height: 600 },
		aboutWindow: { width: 500, height: 400 },
		welcomeWindow: { width: 600, height: 420 }
	};
	
	const defaultSize = defaultSizes[windowType] || { width: 300, height: 300 };
	
	if (config[windowType]?.width !== undefined && config[windowType]?.height !== undefined) {
		return {
			width: config[windowType].width,
			height: config[windowType].height
		};
	}
	
	return defaultSize;
};

const loadWindowPosition = (windowType) => {
	const config = loadConfig();
	const { width } = screen.getPrimaryDisplay().workAreaSize;
	
	// 如果配置中有该窗口的位置信息，则使用配置中的位置
	if (config[windowType]?.x !== undefined && config[windowType]?.y !== undefined) {
		return [config[windowType].x, config[windowType].y];
	}
	
	// 否则返回默认位置
	switch(windowType) {
		case 'clockWindow':
			return [width - 320, 20];
		case 'homeworkWindow':
			return [width - 320, 180]; // 在时钟窗口下方
		case 'launchpadWindow':
			return [width - 320, 480]; // 在作业窗口下方
		default:
			return [width - 320, 20];
	}
};

const saveWindowBounds = (windowType, x, y, width, height) => {
	const config = loadConfig();
	config[windowType] = {
		x,
		y,
		width,
		height
	};
	saveConfig(config);
};

// 时钟窗口
let clockWindow;

const createClockWindow = () => {
	const size = loadWindowSize('clockWindow');
	const [defaultX, defaultY] = loadWindowPosition('clockWindow');

	// 读取置顶设置
	const config = loadConfig();
	const isAlwaysOnTop = config.alwaysOnTop !== undefined ? config.alwaysOnTop : false;
	const isDarkThemeEnabled = config.darkThemeEnabled !== undefined ? config.darkThemeEnabled : false; // 读取暗色主题设置

	clockWindow = new BrowserWindow({
		width: size.width,
		height: size.height,
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

	// 加载时钟页面内容
	clockWindow.loadFile('pages/cards/clock.html');

	// 当窗口 DOM 就绪时发送初始状态
	clockWindow.webContents.once('dom-ready', () => {
		clockWindow.webContents.send('clock-toggle', isClockEnabled);
		clockWindow.webContents.send('always-on-top-toggle', isAlwaysOnTop); // 发送置顶状态
		clockWindow.webContents.send('dark-theme-toggle', isDarkThemeEnabled); // 发送暗色主题状态
	});

	// 监听窗口移动和调整大小事件，保存位置和大小
	clockWindow.on('moved', () => {
		const [x, y] = clockWindow.getPosition();
		const [width, height] = clockWindow.getSize();
		// 保存时钟窗口位置和大小
		saveWindowBounds('clockWindow', x, y, width, height);
	});

	clockWindow.on('resize', () => {
		const [x, y] = clockWindow.getPosition();
		const [width, height] = clockWindow.getSize();
		// 保存时钟窗口位置和大小
		saveWindowBounds('clockWindow', x, y, width, height);
	});

	// 监听窗口关闭事件，保存位置和大小
	clockWindow.on('close', () => {
		const [x, y] = clockWindow.getPosition();
		const [width, height] = clockWindow.getSize();
		// 保存时钟窗口位置和大小
		saveWindowBounds('clockWindow', x, y, width, height);
	});

	return clockWindow;
};

// 作业窗口
let homeworkWindowSplit;

const createHomeworkWindowSplit = () => {
	const config = loadConfig();
	const size = loadWindowSize('homeworkWindow');
	const [defaultX, defaultY] = loadWindowPosition('homeworkWindow');

	const isAlwaysOnTop = config.alwaysOnTop !== undefined ? config.alwaysOnTop : false;
	const isDarkThemeEnabled = config.darkThemeEnabled !== undefined ? config.darkThemeEnabled : false; // 读取暗色主题设置

	homeworkWindowSplit = new BrowserWindow({
		width: size.width,
		height: size.height,
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

	// 加载作业页面内容
	homeworkWindowSplit.loadFile('pages/cards/homework.html');

	// 当窗口 DOM 就绪时发送初始状态
	homeworkWindowSplit.webContents.once('dom-ready', () => {
		homeworkWindowSplit.webContents.send('homework-toggle', isHomeworkEnabled);
		homeworkWindowSplit.webContents.send('always-on-top-toggle', isAlwaysOnTop); // 发送置顶状态
		homeworkWindowSplit.webContents.send('dark-theme-toggle', isDarkThemeEnabled); // 发送暗色主题状态
		homeworkWindowSplit.webContents.send('launchpad-apps-updated', getLaunchpadApps()); // 发送启动台应用数据
	});

	// 监听窗口移动和调整大小事件，保存位置和大小
	homeworkWindowSplit.on('moved', () => {
		const [x, y] = homeworkWindowSplit.getPosition();
		const [width, height] = homeworkWindowSplit.getSize();
		// 保存作业窗口位置和大小
		saveWindowBounds('homeworkWindow', x, y, width, height);
	});

	homeworkWindowSplit.on('resize', () => {
		const [x, y] = homeworkWindowSplit.getPosition();
		const [width, height] = homeworkWindowSplit.getSize();
		// 保存作业窗口位置和大小
		saveWindowBounds('homeworkWindow', x, y, width, height);
	});

	// 监听窗口关闭事件，保存位置和大小
	homeworkWindowSplit.on('close', () => {
		const [x, y] = homeworkWindowSplit.getPosition();
		const [width, height] = homeworkWindowSplit.getSize();
		// 保存作业窗口位置和大小
		saveWindowBounds('homeworkWindow', x, y, width, height);
	});

	return homeworkWindowSplit;
};

// 启动台窗口
let launchpadWindow;

const createLaunchpadWindow = () => {
	const config = loadConfig();
	const size = loadWindowSize('launchpadWindow');
	const [defaultX, defaultY] = loadWindowPosition('launchpadWindow');

	const isAlwaysOnTop = config.alwaysOnTop !== undefined ? config.alwaysOnTop : false;
	const isDarkThemeEnabled = config.darkThemeEnabled !== undefined ? config.darkThemeEnabled : false; // 读取暗色主题设置

	launchpadWindow = new BrowserWindow({
		width: size.width,
		height: size.height,
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

	// 加载启动台页面内容
	launchpadWindow.loadFile('pages/cards/launchpad.html');

	// 当窗口 DOM 就绪时发送初始状态
	launchpadWindow.webContents.once('dom-ready', () => {
		launchpadWindow.webContents.send('always-on-top-toggle', isAlwaysOnTop); // 发送置顶状态
		launchpadWindow.webContents.send('dark-theme-toggle', isDarkThemeEnabled); // 发送暗色主题状态
		launchpadWindow.webContents.send('launchpad-apps-updated', getLaunchpadApps()); // 发送启动台应用数据
	});

	// 监听窗口移动和调整大小事件，保存位置和大小
	launchpadWindow.on('moved', () => {
		const [x, y] = launchpadWindow.getPosition();
		const [width, height] = launchpadWindow.getSize();
		// 保存启动台窗口位置和大小
		saveWindowBounds('launchpadWindow', x, y, width, height);
	});

	launchpadWindow.on('resize', () => {
		const [x, y] = launchpadWindow.getPosition();
		const [width, height] = launchpadWindow.getSize();
		// 保存启动台窗口位置和大小
		saveWindowBounds('launchpadWindow', x, y, width, height);
	});

	// 监听窗口关闭事件，保存位置和大小
	launchpadWindow.on('close', () => {
		const [x, y] = launchpadWindow.getPosition();
		const [width, height] = launchpadWindow.getSize();
		// 保存启动台窗口位置和大小
		saveWindowBounds('launchpadWindow', x, y, width, height);
	});

	return launchpadWindow;
};

// 创建所有组件窗口
const createAllWindows = () => {
	if (isClockEnabled) {
		createClockWindow();
	}
	if (isHomeworkEnabled) {
		createHomeworkWindowSplit();
	}
	// 启动台总是创建，因为它依赖于应用列表，即使没有应用也需要显示
	createLaunchpadWindow();
};

// 作业添加窗口 (用于添加新作业的小窗口)
let homeworkAddWindow;

const createHomeworkAddWindow = () => {
	// 如果窗口已经存在，就聚焦它
	if (homeworkAddWindow) {
		homeworkAddWindow.focus();
		return;
	}

	const size = loadWindowSize('homeworkAddWindow');
	const [defaultX, defaultY] = loadWindowPosition('homeworkAddWindow');

	homeworkAddWindow = new BrowserWindow({
		icon: iconPath,
		frame: false,
		width: size.width,
		height: size.height,
		x: defaultX,
		y: defaultY,
		alwaysOnTop: true,
		resizable: true,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	// 监听窗口移动和调整大小事件，保存位置和大小
	homeworkAddWindow.on('moved', () => {
		const [x, y] = homeworkAddWindow.getPosition();
		const [width, height] = homeworkAddWindow.getSize();
		// 保存作业添加窗口位置和大小
		saveWindowBounds('homeworkAddWindow', x, y, width, height);
	});

	homeworkAddWindow.on('resize', () => {
		const [x, y] = homeworkAddWindow.getPosition();
		const [width, height] = homeworkAddWindow.getSize();
		// 保存作业添加窗口位置和大小
		saveWindowBounds('homeworkAddWindow', x, y, width, height);
	});

	// 加载作业表单页面
	homeworkAddWindow.loadFile('pages/homework-form.html');
	homeworkAddWindow.setMenu(null);

	// 窗口关闭时清理引用
	homeworkAddWindow.on('closed', () => {
		homeworkAddWindow = null;
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

	const size = loadWindowSize('homeworkListWindow');
	const [defaultX, defaultY] = loadWindowPosition('homeworkListWindow');

	homeworkListWindow = new BrowserWindow({
		icon: iconPath,
		frame: false,
		width: size.width,
		height: size.height,
		x: defaultX,
		y: defaultY,
		resizable: true,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	// 监听窗口移动和调整大小事件，保存位置和大小
	homeworkListWindow.on('moved', () => {
		const [x, y] = homeworkListWindow.getPosition();
		const [width, height] = homeworkListWindow.getSize();
		// 保存作业列表窗口位置和大小
		saveWindowBounds('homeworkListWindow', x, y, width, height);
	});

	homeworkListWindow.on('resize', () => {
		const [x, y] = homeworkListWindow.getPosition();
		const [width, height] = homeworkListWindow.getSize();
		// 保存作业列表窗口位置和大小
		saveWindowBounds('homeworkListWindow', x, y, width, height);
	});

	homeworkListWindow.loadFile('pages/homework-list.html');
	homeworkListWindow.setMenu(null);

	// 窗口关闭时清理引用
	homeworkListWindow.on('closed', () => {
		homeworkListWindow = null;
	});

	return homeworkListWindow;
};

// 设置窗口
let settingsWindow;

const createSettingsWindow = () => {
	// 如果窗口已经存在，就聚焦它
	if (settingsWindow) {
		settingsWindow.focus();
		return;
	}

	const size = loadWindowSize('settingsWindow');
	const [defaultX, defaultY] = loadWindowPosition('settingsWindow');

	settingsWindow = new BrowserWindow({
		icon: iconPath,
		frame: false,
		width: size.width,
		height: size.height,
		x: defaultX,
		y: defaultY,
		resizable: true,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	// 监听窗口移动和调整大小事件，保存位置和大小
	settingsWindow.on('moved', () => {
		const [x, y] = settingsWindow.getPosition();
		const [width, height] = settingsWindow.getSize();
		// 保存设置窗口位置和大小
		saveWindowBounds('settingsWindow', x, y, width, height);
	});

	settingsWindow.on('resize', () => {
		const [x, y] = settingsWindow.getPosition();
		const [width, height] = settingsWindow.getSize();
		// 保存设置窗口位置和大小
		saveWindowBounds('settingsWindow', x, y, width, height);
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

	const size = loadWindowSize('aboutWindow');
	const [defaultX, defaultY] = loadWindowPosition('aboutWindow');

	aboutWindow = new BrowserWindow({
		icon: iconPath,
		frame: false,
		width: size.width,
		height: size.height,
		x: defaultX,
		y: defaultY,
		resizable: true,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	// 监听窗口移动和调整大小事件，保存位置和大小
	aboutWindow.on('moved', () => {
		const [x, y] = aboutWindow.getPosition();
		const [width, height] = aboutWindow.getSize();
		// 保存关于窗口位置和大小
		saveWindowBounds('aboutWindow', x, y, width, height);
	});

	aboutWindow.on('resize', () => {
		const [x, y] = aboutWindow.getPosition();
		const [width, height] = aboutWindow.getSize();
		// 保存关于窗口位置和大小
		saveWindowBounds('aboutWindow', x, y, width, height);
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

	const size = loadWindowSize('welcomeWindow');
	const [defaultX, defaultY] = loadWindowPosition('welcomeWindow');

	welcomeWindow = new BrowserWindow({
		icon: iconPath,
		transparent: true,
		frame: false,
		width: size.width,
		height: size.height,
		x: defaultX,
		y: defaultY,
		resizable: false, // 欢迎窗口保持不可调整大小
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	});

	// 欢迎窗口不可调整大小，所以只监听移动事件
	welcomeWindow.on('moved', () => {
		const [x, y] = welcomeWindow.getPosition();
		const [width, height] = welcomeWindow.getSize();
		// 保存欢迎窗口位置和大小
		saveWindowBounds('welcomeWindow', x, y, width, height);
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

// 添加开机自启设置处理程序
const startupSettingHandler = createSettingHandler('startupEnabled', 'startup-toggle');

let isClockEnabled = clockSettingHandler.load();
let isHomeworkEnabled = homeworkSettingHandler.load();
let isAlwaysOnTop = alwaysOnTopSettingHandler.load(); // 置顶状态变量
let isDarkThemeEnabled = darkThemeSettingHandler.load(); // 暗色主题状态变量
let isStartupEnabled = startupSettingHandler.load(); // 开机自启状态变量

const handleClockToggle = (isEnabled) => {
	isClockEnabled = isEnabled;
	clockSettingHandler.handleToggle(isEnabled, clockWindow);
};

const handleHomeworkToggle = (isEnabled) => {
	isHomeworkEnabled = isEnabled;
	homeworkSettingHandler.handleToggle(isEnabled, homeworkWindowSplit);
};

// 暗色主题切换处理函数
const handleDarkThemeToggle = (isEnabled) => {
	isDarkThemeEnabled = isEnabled;
	// 通知所有窗口更新主题
	if (clockWindow) {
		clockWindow.webContents.send('dark-theme-toggle', isEnabled);
	}
	if (homeworkWindowSplit) {
		homeworkWindowSplit.webContents.send('dark-theme-toggle', isEnabled);
	}
	if (launchpadWindow) {
		launchpadWindow.webContents.send('dark-theme-toggle', isEnabled);
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
	isStartupEnabled = startupSettingHandler.load(); // 加载开机自启设置

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
		createAllWindows();
	}

	tray = new Tray(icon);

	const contextMenu = Menu.buildFromTemplate([{
		label: '课堂窗 - ClassWindow',
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
			createAboutWindow();
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
			createHomeworkAddWindow();
		}
	});

	// 监听保存作业的请求
	ipcMain.on('save-homework', (event, homework) => {
		// 添加新作业到JSON文件
		const updatedHomeworkList = addHomework(homework);

		// 将作业数据发送回作业窗口
		if (homeworkWindowSplit) {
			homeworkWindowSplit.webContents.send('new-homework', homework);
		}

		// 通知作业列表窗口刷新数据
		if (homeworkListWindow) {
			homeworkListWindow.webContents.send('refresh-homework-list');
		}
	});

	// 监听获取作业列表的请求
	ipcMain.on('get-homework-list', (event) => {
		const homeworkList = loadHomework();
		event.reply('homework-list-response', homeworkList);
	});

	// 监听删除作业的请求
	ipcMain.on('delete-homework', (event, index) => {
		const updatedHomeworkList = deleteHomework(index);

		// 通知所有相关窗口更新作业列表
		if (homeworkWindowSplit) {
			homeworkWindowSplit.webContents.send('refresh-homework-list');
		}
		if (homeworkListWindow) {
			homeworkListWindow.webContents.send('refresh-homework-list');
		}
	});

	// 监听作业窗口关闭事件
	ipcMain.on('homework-window-closed', () => {
		homeworkAddWindow = null;
	});

	// 监听获取模板列表的请求
	ipcMain.on('get-template-list', (event) => {
		const templateList = getAllTemplates();
		event.reply('template-list-response', templateList);
	});

	// 监听保存模板的请求
	ipcMain.on('save-template', (event, template) => {
		const updatedTemplateList = addTemplate(template);

		// 通知作业表单窗口刷新模板列表（如果存在）
		if (homeworkAddWindow && !homeworkAddWindow.isDestroyed()) {
			homeworkAddWindow.webContents.send('template-saved');
		}
	});

	// 监听删除模板的请求
	ipcMain.on('delete-template', (event, index) => {
		const updatedTemplateList = deleteTemplate(index);
		
		// 通知作业表单窗口刷新模板列表（如果存在）
		if (homeworkAddWindow && !homeworkAddWindow.isDestroyed()) {
			homeworkAddWindow.webContents.send('template-deleted');
		}
	});

	// 监听获取设置的请求
	ipcMain.on('get-settings', () => {
		if (settingsWindow) {
			settingsWindow.webContents.send('settings-updated', {
				clockEnabled: isClockEnabled,
				homeworkEnabled: isHomeworkEnabled,
				alwaysOnTop: isAlwaysOnTop, // 添加置顶状态
				darkThemeEnabled: isDarkThemeEnabled, // 添加暗色主题状态
				startupEnabled: isStartupEnabled, // 添加开机自启状态
				launchpadApps: getLaunchpadApps()
			});
		}
	});

	// 监听时钟开关变化
	ipcMain.on('toggle-clock', (event, isEnabled) => {
		handleClockToggle(isEnabled);
		if (isEnabled && !clockWindow) {
			createClockWindow();
		} else if (!isEnabled && clockWindow) {
			clockWindow.close();
			clockWindow = null;
		}
	});

	// 监听作业开关变化
	ipcMain.on('toggle-homework', (event, isEnabled) => {
		handleHomeworkToggle(isEnabled);
		if (isEnabled && !homeworkWindowSplit) {
			createHomeworkWindowSplit();
		} else if (!isEnabled && homeworkWindowSplit) {
			homeworkWindowSplit.close();
			homeworkWindowSplit = null;
		}
	});

	// 监听置顶开关变化
	ipcMain.on('toggle-always-on-top', (event, isEnabled) => {
		// 更新所有窗口的置顶状态
		if (clockWindow) {
			clockWindow.setAlwaysOnTop(isEnabled);
		}
		if (homeworkWindowSplit) {
			homeworkWindowSplit.setAlwaysOnTop(isEnabled);
		}
		if (launchpadWindow) {
			launchpadWindow.setAlwaysOnTop(isEnabled);
		}
	});

	// 监听暗色主题开关变化
	ipcMain.on('toggle-dark-theme', (event, isEnabled) => {
		handleDarkThemeToggle(isEnabled);
	});

	// 监听开机自启开关变化
	ipcMain.on('toggle-startup', (event, isEnabled) => {
		isStartupEnabled = isEnabled;
		startupSettingHandler.handleToggle(isEnabled);

		if (isEnabled) {
			// 启用开机自启
			app.setLoginItemSettings({
				openAtLogin: true,
				path: app.getPath('exe')
			});
		} else {
			// 禁用开机自启
			app.setLoginItemSettings({
				openAtLogin: false,
				path: app.getPath('exe')
			});
		}
	});

	// 监听添加启动台应用
	ipcMain.on('add-launchpad-app', (event, app) => {
		const updatedApps = addLaunchpadApp(app);
		if (updatedApps) {
			// 通知所有窗口更新启动台应用列表
			if (homeworkWindowSplit) {
				homeworkWindowSplit.webContents.send('launchpad-apps-updated', updatedApps);
			}
			if (launchpadWindow) {
				launchpadWindow.webContents.send('launchpad-apps-updated', updatedApps);
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
			if (homeworkWindowSplit) {
				homeworkWindowSplit.webContents.send('launchpad-apps-updated', updatedApps);
			}
			if (launchpadWindow) {
				launchpadWindow.webContents.send('launchpad-apps-updated', updatedApps);
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

	// 监听作业列表窗口关闭事件
	ipcMain.on('homework-list-window-closed', () => {
		homeworkListWindow = null;
	});

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createAllWindows();
		}
	});
});

app.on('window-all-closed', () => { });