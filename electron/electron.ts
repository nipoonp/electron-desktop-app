import { app, BrowserWindow, dialog, globalShortcut } from "electron";
import { ipcMain, Menu } from "electron";
import {
    encodeCommandBuffer,
    decodeCommandBuffer,
    printCustomerReceipt,
    printKitchenReceipt,
    printSalesDataReceipt,
    delay,
    printKitchenReceiptSmall,
    printKitchenReceiptLarge,
} from "./util";
import { IOrderReceipt, IPrintReceiptDataOutput, IPrintReceiptOutput, IPrintSalesDataInput, IPrintSalesDataOutput } from "./model";
import path from "path";
import net from "net";
import * as Sentry from "@sentry/electron";
const { autoUpdater } = require("electron-updater");

Sentry.init({ dsn: "https://43d342efd1534e1b80c9ab4251b385a6@o1087887.ingest.sentry.io/6102047" });

let mainWindow: any;
let verifoneClient = new net.Socket();
let isDevToolsOpen = false;

app.disableHardwareAcceleration();

const simpleStringify = (object: Object) => {
    var simpleObject = {};
    for (var prop in object) {
        if (!object.hasOwnProperty(prop)) {
            continue;
        }
        if (typeof object[prop] == "object") {
            continue;
        }
        if (typeof object[prop] == "function") {
            continue;
        }
        simpleObject[prop] = object[prop];
    }

    return JSON.stringify(simpleObject); // returns cleaned up JSON
};

const createWindow = () => {
    mainWindow = new BrowserWindow({
        kiosk: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadFile(path.join(__dirname, "index.html"));

    mainWindow.on("closed", () => {
        mainWindow = null;
    });

    mainWindow.on("render-process-gone", async (event, webContents, details) => {
        console.log("xxx...child-process-gone", event, webContents, details);
        dialog.showMessageBox(mainWindow, {
            title: "Restarting...",
            buttons: [],
            type: "warning",
            message: "Application is restarting…",
        });

        Sentry.captureException(new Error("child-process-gone: " + simpleStringify({ event, webContents, details })));
        await delay(2000);

        app.relaunch();
        app.exit();
    });

    mainWindow.on("child-process-gone", async (event, details) => {
        console.log("xxx...child-process-gone", event, details);
        dialog.showMessageBox(mainWindow, {
            title: "Restarting...",
            buttons: [],
            type: "warning",
            message: "Application is restarting…",
        });

        Sentry.captureException(new Error("child-process-gone: " + simpleStringify({ event, details })));
        await delay(2000);

        app.relaunch();
        app.exit();
    });

    mainWindow.on("unresponsive", async () => {
        const message = `xxx...unresponsive`;

        console.log(message);
        dialog.showMessageBox(mainWindow, {
            title: "Restarting...",
            buttons: [],
            type: "warning",
            message: "Application is restarting…",
        });

        Sentry.captureException(new Error(message));
        await delay(2000);

        app.relaunch();
        app.exit();
    });

    //Deprecated
    mainWindow.on("crashed", async (event, killed) => {
        console.log("xxx...child-process-gone", event, killed);
        dialog.showMessageBox(mainWindow, {
            title: "Restarting...",
            buttons: [],
            type: "warning",
            message: "Application is restarting…",
        });

        Sentry.captureException(new Error("child-process-gone: " + simpleStringify({ event, killed })));
        await delay(2000);

        app.relaunch();
        app.exit();
    });

    mainWindow.webContents.on("unresponsive", async () => {
        //When process.hang()
        const message = `xxx...webContents.unresponsive`;

        console.log(message);
        dialog.showMessageBox(mainWindow, {
            title: "Restarting...",
            buttons: [],
            type: "warning",
            message: "Application is restarting…",
        });

        Sentry.captureException(new Error(message));
        await delay(2000);

        app.relaunch();
        app.exit();
    });

    mainWindow.webContents.on("render-process-gone", async (event, webContents, details) => {
        console.log("xxx...child-process-gone", event, webContents, details);
        dialog.showMessageBox(mainWindow, {
            title: "Restarting...",
            buttons: [],
            type: "warning",
            message: "Application is restarting…",
        });

        Sentry.captureException(new Error("child-process-gone: " + simpleStringify({ event, webContents, details })));
        await delay(2000);

        app.relaunch();
        app.exit();
    });

    mainWindow.webContents.on("plugin-crashed", async (event, name, version) => {
        console.log("xxx...child-process-gone", event, name, version);
        dialog.showMessageBox(mainWindow, {
            title: "Restarting...",
            buttons: [],
            type: "warning",
            message: "Application is restarting…",
        });

        Sentry.captureException(new Error("child-process-gone: " + simpleStringify({ event, name, version })));
        await delay(2000);

        app.relaunch();
        app.exit();
    });

    globalShortcut.register("Shift+CommandOrControl+I", () => {
        isDevToolsOpen ? mainWindow.webContents.closeDevTools() : mainWindow.webContents.openDevTools();
        isDevToolsOpen = !isDevToolsOpen;
    });

    mainWindow.webContents.openDevTools();

    // Check for app updates every 3 seconds after launch
    initUpdater();
    checkForUpdates();
    setInterval(checkForUpdates, 10 * 1000);

    // Hide the menu bar
    mainWindow.setMenu(null);
};

const checkForUpdates = () => {
    autoUpdater.checkForUpdates();
};

const initUpdater = () => {
    autoUpdater.on("update-available", (_event, releaseNotes, releaseName) => {
        const dialogOpts: any = {
            type: "info",
            buttons: ["Ok"],
            title: "Application Update",
            message: process.platform === "win32" ? releaseNotes : releaseName,
            detail: "A new version is being downloaded.",
        };
        dialog.showMessageBox(dialogOpts);
    });

    autoUpdater.on("update-downloaded", (_event, releaseNotes, releaseName) => {
        const dialogOpts = {
            type: "info",
            buttons: ["Restart", "Later"],
            title: "Application Update",
            message: process.platform === "win32" ? releaseNotes : releaseName,
            detail: "A new version has been downloaded. Restart the application to apply the updates.",
        };
        dialog.showMessageBox(dialogOpts).then((returnValue) => {
            if (returnValue.response === 0) autoUpdater.quitAndInstall();
        });
    });
};

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

ipcMain.on("RESTART_ELECTRON_APP", (event: any) => {
    app.relaunch();
    app.exit();
});

ipcMain.on("EXIT_ELECTRON_APP", (event: any) => {
    app.exit();
});

// Webapp Receipt Printer Side
ipcMain.handle("RECEIPT_PRINTER_DATA", async (event: any, order: IOrderReceipt): Promise<IPrintReceiptDataOutput> => {
    try {
        // A receipt request could have print customer receipts and kitchen receipts enabled. So we would have to print 2 copies.
        if (order.customerPrinter) {
            const result: IPrintReceiptOutput = await printCustomerReceipt(order);

            if (result.error) return { error: result.error, order: order };
        }

        if (order.kitchenPrinter) {
            const result: IPrintReceiptOutput = await printKitchenReceipt(order);

            if (result.error) return { error: result.error, order: order };
        }

        if (order.kitchenPrinterSmall) {
            const result: IPrintReceiptOutput = await printKitchenReceiptSmall(order);

            if (result.error) return { error: result.error, order: order };
        }

        if (order.kitchenPrinterLarge) {
            const result: IPrintReceiptOutput = await printKitchenReceiptLarge(order);

            if (result.error) return { error: result.error, order: order };
        }

        return { error: null, order: order };
    } catch (e) {
        return { error: e, order: order };
    }
});

ipcMain.handle("RECEIPT_SALES_DATA", async (event: any, printSalesDataInput: IPrintSalesDataInput): Promise<IPrintSalesDataOutput> => {
    try {
        const result: IPrintReceiptOutput = await printSalesDataReceipt(printSalesDataInput);

        if (result.error) return { error: result.error, printSalesDataInput: printSalesDataInput };

        return { error: null, printSalesDataInput: printSalesDataInput };
    } catch (e) {
        return { error: e, printSalesDataInput: printSalesDataInput };
    }
});

ipcMain.on("SENTRY_CURRENT_USER", (event: any, data: any) => {
    Sentry.setUser({ email: `${data.email} ${data.register}` });
});

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
