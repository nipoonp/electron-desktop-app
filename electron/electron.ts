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
import { format } from "date-fns";
const { autoUpdater } = require("electron-updater");

Sentry.init({ dsn: "https://43d342efd1534e1b80c9ab4251b385a6@o1087887.ingest.sentry.io/6102047" });

let mainWindow: any;
let verifoneClient = new net.Socket();
let isDevToolsOpen = false;
let updatedStarted = false;

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

    globalShortcut.register("Shift+CommandOrControl+Q", () => {
        if (updatedStarted) return;

        console.log("Updating...");
        autoUpdater.autoDownload = false;
        autoUpdater.checkForUpdates();

        updatedStarted = true;
    });

    // Hide the menu bar
    mainWindow.setMenu(null);
};

autoUpdater.on("update-available", () => {
    mainWindow.webContents.send("ELECTRON_UPDATER", "Found new update. Downloading now...");
    autoUpdater.downloadUpdate();
});

autoUpdater.on("update-downloaded", (info) => {
    mainWindow.webContents.send("ELECTRON_UPDATER", `Update downloaded. Version: ${info.releaseName}. App is restarting.`);
    autoUpdater.quitAndInstall(false, true);
});

autoUpdater.on("download-progress", (info) => {
    const percentDownloaded = info.percent.toFixed(2);
    const downloadSpeed = info.bytesPerSecond.toFixed(2);

    mainWindow.webContents.send(
        "ELECTRON_UPDATER",
        `Downloading new update... Progress: ${percentDownloaded}%. Download Speed: ${downloadSpeed} B/s`
    );
    mainWindow.setProgressBar(percentDownloaded / 100);
});

autoUpdater.on("error", (error) => {
    mainWindow.webContents.send("ELECTRON_UPDATER", `There was an error updating. ${error}`);
});

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
    console.log(`${format(new Date(), "dd/MM/yy HH:mm:ss.SSS ")}: Connecting to Verifone Eftpos on ${data.portNumber}:${data.ipAddress}`);
    verifoneClient.connect(data.portNumber, data.ipAddress);
});

ipcMain.on("BROWSER_DATA", (event: any, data: any) => {
    console.log(`Eftpos Data ${format(new Date(), "dd/MM/yy HH:mm:ss.SSS ")}`);
    verifoneClient.write(encodeCommandBuffer(data.toString()));
});

ipcMain.on("BROWSER_EFTPOS_DISCONNECT", () => {
    console.log(`Disconnecting from Verifone Eftpos ${format(new Date(), "dd/MM/yy HH:mm:ss.SSS ")}`);
    console.log(`Disconnecting from Verifone Eftpos`);
    verifoneClient.destroy();
});

// Verifone Eftpos Side
verifoneClient.on("connect", () => {
    console.log(`EFTPOS_CONNECT ${format(new Date(), "dd/MM/yy HH:mm:ss.SSS ")}: Connected to Verifone Eftpos!`);
    mainWindow.webContents.send("EFTPOS_CONNECT", "Connected to Verifone Eftpos!");
});

verifoneClient.on("data", (data: Buffer) => {
    // console.log("EFTPOS_DATA", data.toString());
    console.log(`EFTPOS_DATA ${format(new Date(), "dd/MM/yy HH:mm:ss.SSS ")}: ${decodeCommandBuffer(data)}`);
    mainWindow.webContents.send("EFTPOS_DATA", decodeCommandBuffer(data));
});

verifoneClient.on("error", (error: Error) => {
    console.log(`EFTPOS_ERROR ${format(new Date(), "dd/MM/yy HH:mm:ss.SSS ")}: ${error.message}`);
    mainWindow.webContents.send("EFTPOS_ERROR", error.message);
});

verifoneClient.on("close", (had_error: boolean) => {
    console.log(`EFTPOS_CONNECT ${format(new Date(), "dd/MM/yy HH:mm:ss.SSS ")}: Connection with Verifone Eftpos ended!`);
    mainWindow.webContents.send("EFTPOS_CLOSE", "Connection with Verifone Eftpos ended!");
});
