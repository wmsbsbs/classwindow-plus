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

// 获取默认位置（右上角）
const getDefaultPosition = () => {
	const {
		width
	} = screen.getPrimaryDisplay().workAreaSize;
	return [width - 320, 20];
};

// 读取/保存窗口位置
const loadWindowPosition = () => {
	const config = loadConfig();
	if (config.window?.x !== undefined && config.window?.y !== undefined) {
		return [config.window.x, config.window.y];
	}
	return getDefaultPosition();
};

const saveWindowPosition = (x, y) => {
	const config = loadConfig();
	config.window = {
		x,
		y
	};
	saveConfig(config);
};

// 时钟窗口
let clockWindow;

const createClockWindow = () => {
	const [defaultX, defaultY] = loadWindowPosition();

	// 读取置顶设置
	const config = loadConfig();
	const isAlwaysOnTop = config.alwaysOnTop !== undefined ? config.alwaysOnTop : false;
	const isDarkThemeEnabled = config.darkThemeEnabled !== undefined ? config.darkThemeEnabled : false; // 读取暗色主题设置

	clockWindow = new BrowserWindow({
		width: 300,
		height: 150,
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
	clockWindow.loadFile('pages/clock.html');

	// 当窗口 DOM 就绪时发送初始状态
	clockWindow.webContents.once('dom-ready', () => {
		clockWindow.webContents.send('clock-toggle', isClockEnabled);
		clockWindow.webContents.send('always-on-top-toggle', isAlwaysOnTop); // 发送置顶状态
		clockWindow.webContents.send('dark-theme-toggle', isDarkThemeEnabled); // 发送暗色主题状态
	});

	// 监听窗口移动事件，保存位置
	clockWindow.on('moved', () => {
		const [x, y] = clockWindow.getPosition();
		// 保存时钟窗口位置
		const config = loadConfig();
		config.clockWindow = { x, y };
		saveConfig(config);
	});

	// 监听窗口关闭事件，保存位置
	clockWindow.on('close', () => {
		const [x, y] = clockWindow.getPosition();
		// 保存时钟窗口位置
		const config = loadConfig();
		config.clockWindow = { x, y };
		saveConfig(config);
	});

	return clockWindow;
};

// 作业窗口
let homeworkWindowSplit;

const createHomeworkWindowSplit = () => {
	const config = loadConfig();
	let defaultX, defaultY;

	// 尝试从配置中读取作业窗口位置，如果没有则使用默认位置
	if (config.homeworkWindow?.x !== undefined && config.homeworkWindow?.y !== undefined) {
		defaultX = config.homeworkWindow.x;
		defaultY = config.homeworkWindow.y;
	} else {
		const [origX, origY] = loadWindowPosition(); // 使用原始默认位置作为基础
		defaultX = origX;
		defaultY = origY + 160; // 在时钟窗口下方
	}

	const isAlwaysOnTop = config.alwaysOnTop !== undefined ? config.alwaysOnTop : false;
	const isDarkThemeEnabled = config.darkThemeEnabled !== undefined ? config.darkThemeEnabled : false; // 读取暗色主题设置

	homeworkWindowSplit = new BrowserWindow({
		width: 300,
		height: 300,
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
	homeworkWindowSplit.loadFile('pages/homework.html');

	// 当窗口 DOM 就绪时发送初始状态
	homeworkWindowSplit.webContents.once('dom-ready', () => {
		homeworkWindowSplit.webContents.send('homework-toggle', isHomeworkEnabled);
		homeworkWindowSplit.webContents.send('always-on-top-toggle', isAlwaysOnTop); // 发送置顶状态
		homeworkWindowSplit.webContents.send('dark-theme-toggle', isDarkThemeEnabled); // 发送暗色主题状态
		homeworkWindowSplit.webContents.send('launchpad-apps-updated', getLaunchpadApps()); // 发送启动台应用数据
	});

	// 监听窗口移动事件，保存位置
	homeworkWindowSplit.on('moved', () => {
		const [x, y] = homeworkWindowSplit.getPosition();
		// 保存作业窗口位置
		const config = loadConfig();
		config.homeworkWindow = { x, y };
		saveConfig(config);
	});

	// 监听窗口关闭事件，保存位置
	homeworkWindowSplit.on('close', () => {
		const [x, y] = homeworkWindowSplit.getPosition();
		// 保存作业窗口位置
		const config = loadConfig();
		config.homeworkWindow = { x, y };
		saveConfig(config);
	});

	return homeworkWindowSplit;
};

// 启动台窗口
let launchpadWindow;

const createLaunchpadWindow = () => {
	const config = loadConfig();
	let defaultX, defaultY;

	// 尝试从配置中读取启动台窗口位置，如果没有则使用默认位置
	if (config.launchpadWindow?.x !== undefined && config.launchpadWindow?.y !== undefined) {
		defaultX = config.launchpadWindow.x;
		defaultY = config.launchpadWindow.y;
	} else {
		const [origX, origY] = loadWindowPosition(); // 使用原始默认位置作为基础
		defaultX = origX;
		defaultY = origY + 470; // 在作业窗口下方
	}

	const isAlwaysOnTop = config.alwaysOnTop !== undefined ? config.alwaysOnTop : false;
	const isDarkThemeEnabled = config.darkThemeEnabled !== undefined ? config.darkThemeEnabled : false; // 读取暗色主题设置

	launchpadWindow = new BrowserWindow({
		width: 300,
		height: 200,
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
	launchpadWindow.loadFile('pages/launchpad.html');

	// 当窗口 DOM 就绪时发送初始状态
	launchpadWindow.webContents.once('dom-ready', () => {
		launchpadWindow.webContents.send('always-on-top-toggle', isAlwaysOnTop); // 发送置顶状态
		launchpadWindow.webContents.send('dark-theme-toggle', isDarkThemeEnabled); // 发送暗色主题状态
		launchpadWindow.webContents.send('launchpad-apps-updated', getLaunchpadApps()); // 发送启动台应用数据
	});

	// 监听窗口移动事件，保存位置
	launchpadWindow.on('moved', () => {
		const [x, y] = launchpadWindow.getPosition();
		// 保存启动台窗口位置
		const config = loadConfig();
		config.launchpadWindow = { x, y };
		saveConfig(config);
	});

	// 监听窗口关闭事件，保存位置
	launchpadWindow.on('close', () => {
		const [x, y] = launchpadWindow.getPosition();
		// 保存启动台窗口位置
		const config = loadConfig();
		config.launchpadWindow = { x, y };
		saveConfig(config);
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

	homeworkAddWindow = new BrowserWindow({
		icon: iconPath,
		frame: false,
		alwaysOnTop: true,
		resizable: true,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
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

	homeworkListWindow = new BrowserWindow({
		icon: iconPath,
		frame: false,
		width: 800,
		height: 600,
		resizable: true,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
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

	settingsWindow = new BrowserWindow({
		icon: iconPath,
		frame: false,
		width: 700,
		height: 600,
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
		width: 600,
		height: 420,
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
