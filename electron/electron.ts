import electron from 'electron';
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
import { ipcMain } from 'electron';
//@ts-ignore
import updater = require("./updater");
import path from 'path';
// import isDev from 'electron-is-dev';

import net from "net";
import {
  encodeCommandBuffer,
  decodeCommandBuffer,
  printReceipt,
} from "./util";
import { IOrderReceipt } from "./model";

let verifoneClient = new net.Socket();

let mainWindow: any;

function createWindow() {

  // Check for app updates 3 seconds after launch
  // const updater = new Updater();
  setTimeout(updater, 3000);

  // mainWindow = new BrowserWindow({width: 900, height: 680, fullscreen: true});
  mainWindow = new BrowserWindow({
    width: 1024, height: 900, fullscreen: true, frame: false, webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js")
    }
  });
  // mainWindow.loadURL(`file://${path.join(__dirname, '../build/index.html')}`);
  mainWindow.loadFile(path.join(__dirname, "index.html"));
  mainWindow.on('closed', () => { mainWindow = null });

  // Hide the menu bar
  mainWindow.setMenu(null);

  // mainWindow.webContents.openDevTools()
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Webapp Receipt Printer Side
ipcMain.on("RECEIPT_PRINTER_1_DATA", async (event: any, data: IOrderReceipt) => {
  try {
    await printReceipt(data);
  } catch (e) {
    mainWindow.webContents.send("RECEIPT_PRINTER_1_ERROR", e)
  }
});

ipcMain.on("RECEIPT_PRINTER_2_DATA", async (event: any, data: IOrderReceipt) => {
  try {
    await printReceipt(data);
  } catch (e) {
    mainWindow.webContents.send("RECEIPT_PRINTER_2_ERROR", e)
  }
});

ipcMain.on("RECEIPT_PRINTER_3_DATA", async (event: any, data: IOrderReceipt) => {
  try {
    await printReceipt(data);
  } catch (e) {
    mainWindow.webContents.send("RECEIPT_PRINTER_3_ERROR", e)
  }
});

// Webapp Side
ipcMain.on("BROWSER_EFTPOS_CONNECT", (data: any) => {
  console.log(
    `Connecting to Verifone Eftpos on ${data.portNumber}:${data.ipAddress}`
  );
  verifoneClient.connect(data.portNumber, data.ipAddress);
});

ipcMain.on("BROWSER_DATA", (data: any) => {
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