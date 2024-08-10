const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('node:path');

let mainWindow;
let tray = null;

// 确保单实例应用
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // 单实例检测
    // 当尝试启动第二个实例时，聚焦到现有的窗口
    if (mainWindow) {
      if (mainWindow.isMinimized() || !mainWindow.isVisible()) {
        mainWindow.show();
      }
      mainWindow.focus();
    }
  });

  function createWindow() {
    // 创建浏览器窗口
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      icon: path.join(__dirname, 'icons/logo.ico'),
      title: "Messenger",
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    // 加载应用的 URL
    mainWindow.loadURL('https://messenger.com'); // 替换为你要跳转的网站

    // 移除菜单栏
    mainWindow.setMenu(null);

    // 按下 F5 时重载窗口
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F5') {
        console.log('[Log][NORMAL] F5 Pressed, Reloading...')
        mainWindow.reload();
        event.preventDefault();
      }
    });

    // 按下 F12 时打开DevTools
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12') {
        console.log('[Log][NORMAL] F12 Pressed, Opening DevTools...')
        mainWindow.webContents.openDevTools();
        event.preventDefault();
      }
    });

    // 按下 F7 时退出进程 4DEBUG
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F7') {
        console.log('[Log][NORMAL] F7 Pressed, Exiting...')
        app.isQuiting = true;
        app.quit();
        event.preventDefault();
      }
    });

    // 关闭窗口时隐藏到托盘
    mainWindow.on('close', (event) => {
      if (!app.isQuiting) {
        event.preventDefault();
        mainWindow.hide();
      }
    });

    // 监听页面加载完成事件
    mainWindow.webContents.on('did-finish-load', () => {
      // 注入 JavaScript 代码删除指定 class 的元素，延时2.5秒
      console.log('[Log][ClassRemover] StartCount: 2.5s');
      const classSelector = '.x9f619.x1n2onr6.x1ja2u2z.x78zum5.x1r8uery.xs83m0k.xeuugli.x1qughib.x6s0dn4.xozqiw3.x1q0g3np.xknmibj.x1c4vz4f.xt55aet.xexx8yu.xc73u3c.x18d9i69.x5ib6vp.x1lku1pv';
      mainWindow.webContents.executeJavaScript(`
    document.title = 'Messenger Electron by her23dev';
    setTimeout(() => {
      document.querySelectorAll('${classSelector}').forEach(element => element.remove());
    }, 2500);
      `);
      });
    }

  // 创建托盘图标
  function createTray() {
    tray = new Tray(path.join(__dirname, 'icons/logo.ico'));

    const contextMenu = Menu.buildFromTemplate([
      { label: '显示应用', click: () => { mainWindow.show(); } },
      {
        label: '退出', click: () => {
          app.isQuiting = true;
          app.quit();
        }
      }
    ]);

    tray.setToolTip('Messenger');
    tray.setContextMenu(contextMenu);

    // 点击托盘图标时显示主窗口
    tray.on('click', () => {
      if (!mainWindow.isVisible() || mainWindow.isMinimized()) {
        mainWindow.show();
        mainWindow.focus();
      } else {
        mainWindow.focus();
      }
    });
  }

  // 当 Electron 初始化完成并准备创建浏览器窗口时调用此方法
  // 部分 API 只能在此事件发生后使用
  app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on('activate', function () {
      // 在 macOS 上，当点击 dock 图标并且没有其他窗口打开时，重新创建一个窗口
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  // 主进程监听标题变化的事件
  ipcMain.on('title-changed', (event, newTitle) => {
    console.log('Title changed to:', newTitle);

    // 根据标题动态更新托盘图标
    let iconPath;
    if (newTitle.includes('Condition1')) {
      iconPath = path.join(__dirname, 'icons/condition1.ico');
    } else if (newTitle.includes('Condition2')) {
      iconPath = path.join(__dirname, 'icons/condition2.ico');
    } else {
      iconPath = path.join(__dirname, 'icons/logo.ico'); // 默认图标
    }

    const image = nativeImage.createFromPath(iconPath);
    tray.setImage(image);
  });

  // 除了 macOS 外，关闭所有窗口时退出应用
  // 在 macOS 上，应用及其菜单栏通常会保持活动状态，直到用户按 Cmd + Q 显式退出
  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
  });
}
