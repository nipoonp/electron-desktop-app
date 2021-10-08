import electron from "electron";
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

// Setup file logging
// var log = require('electron-log');

import isDev from "electron-is-dev";
import { ipcMain, Menu } from "electron";
import path from "path";
import { dialog } from "electron";
import { autoUpdater } from "electron-updater";
import net from "net";
import { encodeCommandBuffer, decodeCommandBuffer, printReceipt } from "./util";
import { IOrderReceipt, IPrintReceiptDataOutput, IPrintReceiptOutput } from "./model";

let mainWindow: any;
let verifoneClient = new net.Socket();

// app.disableHardwareAcceleration();

function createWindow() {
    // mainWindow = new BrowserWindow({width: 900, height: 680, fullscreen: true});
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 900,
        fullscreen: true,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, "preload.js"),
        },
    });
    // mainWindow.loadURL(`file://${path.join(__dirname, '../build/index.html')}`);
    mainWindow.loadFile(path.join(__dirname, "index.html"));
    mainWindow.on("closed", () => {
        mainWindow = null;
    });

    // Check for app updates every 3 seconds after launch
    // initUpdater();
    // checkForUpdates();
    // setInterval(checkForUpdates, 10 * 1000);

    // Hide the menu bar
    mainWindow.setMenu(null);

    // mainWindow.webContents.openDevTools();
}

const checkForUpdates = () => {
    autoUpdater.checkForUpdates();
};

const initUpdater = () => {
    // autoUpdater.autoDownload = true;

    autoUpdater.on("update-available", () => {
        mainWindow.webContents.send("ELECTRON_UPDATER", "Found new update. Downloading now...");
        autoUpdater.downloadUpdate();
    });

    autoUpdater.on("update-downloaded", (info) => {
        mainWindow.webContents.send("ELECTRON_UPDATER", `Update downloaded. Version: ${info.releaseName}. App is restarting.`);
        autoUpdater.quitAndInstall(false, true);
    });

    autoUpdater.on("download-progress", (info) => {
        mainWindow.webContents.send("ELECTRON_UPDATER", `Downloading new update... Progress: ${info.percent}%.`);
    });

    autoUpdater.on("error", (error) => {
        mainWindow.webContents.send("ELECTRON_UPDATER", `There was an error updating. ${error}`);
    });
};

//This is to make sure we dont have two instances of the app running at the same time.
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on("second-instance", (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    // Create mainWindow, load the rest of the app, etc...
    app.once("ready", createWindow);

    app.once("window-all-closed", () => {
        if (process.platform !== "darwin") {
            app.quit();
        }
    });
}

// Webapp Receipt Printer Side
ipcMain.handle(
    "RECEIPT_PRINTER_DATA",
    async (event: any, order: IOrderReceipt): Promise<IPrintReceiptDataOutput> => {
        try {
            // A receipt request could have print customer receipts and kitchen receipts enabled. So we would have to print 2 copies.
            if (order.customerPrinter) {
                const result: IPrintReceiptOutput = await printReceipt(order, true);

                if (result.error) return { error: result.error, order: order };
            }

            if (order.kitchenPrinter) {
                const result: IPrintReceiptOutput = await printReceipt(order, false);

                if (result.error) return { error: result.error, order: order };
            }

            return { error: null, order: order };
        } catch (e) {
            return { error: e, order: order };
        }
    }
);

// Webapp Side
ipcMain.on("BROWSER_EFTPOS_CONNECT", (event: any, data: any) => {
    console.log(`Connecting to Verifone Eftpos on ${data.portNumber}:${data.ipAddress}`);
    verifoneClient.connect(data.portNumber, data.ipAddress);
});

ipcMain.on("BROWSER_DATA", (event: any, data: any) => {
    verifoneClient.write(encodeCommandBuffer(data.toString()));
});

ipcMain.on("BROWSER_EFTPOS_DISCONNECT", () => {
    console.log(`Disconnecting from Verifone Eftpos`);
    verifoneClient.destroy();
});

// Verifone Eftpos Side
verifoneClient.on("connect", () => {
    mainWindow.webContents.send("EFTPOS_CONNECT", "Connected to Verifone Eftpos!");
});

verifoneClient.on("data", (data: Buffer) => {
    console.log("EFTPOS_DATA", data.toString());
    mainWindow.webContents.send("EFTPOS_DATA", decodeCommandBuffer(data));
});

verifoneClient.on("error", (error: Error) => {
    mainWindow.webContents.send("EFTPOS_ERROR", error.message);
});

verifoneClient.on("close", (had_error: boolean) => {
    mainWindow.webContents.send("EFTPOS_CLOSE", "Connection with Verifone Eftpos ended!");
});

ipcMain.on("SHOW_CONTEXT_MENU", (event) => {
    const template = [
        {
            label: "Kiosk Mode",
            click: () => {
                event.sender.send("CONTEXT_MENU_COMMAND", "kioskMode");
            },
        },
        {
            label: "Stock",
            click: () => {
                event.sender.send("CONTEXT_MENU_COMMAND", "stock");
            },
        },
        {
            label: "Orders",
            click: () => {
                event.sender.send("CONTEXT_MENU_COMMAND", "orders");
            },
        },
        {
            label: "Reports",
            click: () => {
                event.sender.send("CONTEXT_MENU_COMMAND", "reports");
            },
        },
        {
            label: "Configure New Eftpos & Printers",
            click: () => {
                event.sender.send("CONTEXT_MENU_COMMAND", "configureEftposAndPrinters");
            },
        },
        {
            label: "Configure Restaurant",
            click: () => {
                event.sender.send("CONTEXT_MENU_COMMAND", "configureRestaurant");
            },
        },
        {
            label: "Configure Register",
            click: () => {
                event.sender.send("CONTEXT_MENU_COMMAND", "configureRegister");
            },
        },
        {
            label: "Log Out",
            click: () => {
                event.sender.send("CONTEXT_MENU_COMMAND", "logout");
            },
        },
    ];
    //@ts-ignore
    const menu = Menu.buildFromTemplate(template);
    menu.popup();
});
