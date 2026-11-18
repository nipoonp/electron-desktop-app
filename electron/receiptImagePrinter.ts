import { BrowserWindow } from "electron";

const QRCode = require("qr.js");
const RECEIPT_WIDTH = 576; // Printable dots on the 80 mm kitchen printer.
const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Keep the existing kitchen receipt's printer calls while rendering their content as HTML.
export const createReceiptImagePrinter = () => {
    const lines: string[] = [];
    let line = "";
    let alignment = "left";
    let bold = false;
    let underline = false;
    let inverted = false;
    let fontSize = 20;
    let size = 1;

    const newLine = () => {
        lines.push(`<div class="line" style="text-align:${alignment}">${line || "<br>"}</div>`);
        line = "";
    };
    const print = (text: string) => {
        line +=
            `<span style="font-size:${fontSize * size}px;line-height:${30 * size}px;font-weight:${bold ? "bold" : "normal"};` +
            `text-decoration:${underline ? "underline" : "none"};color:${inverted ? "white" : "black"};` +
            `background:${inverted ? "black" : "white"}">${escapeHtml(String(text))}</span>`;
    };
    const addImage = (source: string) => {
        if (line) newLine();
        lines.push(`<div style="text-align:${alignment}"><img style="max-width:100%" src="${source}"></div>`);
    };

    return {
        print,
        println: (text: string) => {
            print(text);
            newLine();
        },
        newLine,
        alignCenter: () => {
            alignment = "center";
        },
        alignLeft: () => {
            alignment = "left";
        },
        bold: (enabled: boolean) => {
            bold = enabled;
        },
        underlineThick: (enabled: boolean) => {
            underline = enabled;
        },
        invert: (enabled: boolean) => {
            inverted = enabled;
        },
        setTextSize: (height: number, _width: number) => {
            size = height + 1;
        },
        setTextNormal: () => {
            size = 1;
            fontSize = 20;
        },
        setTypeFontA: () => {
            fontSize = 20;
        },
        setTypeFontB: () => {
            fontSize = 15;
        },
        drawLine: () => {
            if (line) newLine();
            lines.push('<div style="height:30px;display:flex;align-items:center"><div style="width:100%;border-top:2px dashed black"></div></div>');
        },
        tableCustom: (cells: { text: string; align: string; width: number; bold?: boolean }[]) => {
            if (line) newLine();
            lines.push(
                `<div style="display:flex">${cells
                    .map(
                        (cell) =>
                            `<div style="width:${cell.width * 100}%;text-align:${cell.align.toLowerCase()};font-weight:${cell.bold ? "bold" : "normal"}">${escapeHtml(cell.text)}</div>`,
                    )
                    .join("")}</div>`,
            );
        },
        printImageBuffer: async (image: Buffer) => {
            addImage(`data:image/png;base64,${image.toString("base64")}`);
        },
        printQR: (text: string) => {
            const qr = QRCode(Buffer.from(text, "utf8").toString("latin1")).modules;
            let path = "";
            for (let y = 0; y < qr.length; y++) {
                for (let x = 0; x < qr.length; x++) {
                    if (qr[y][x]) path += `M${x + 4} ${y + 4}h1v1h-1z`;
                }
            }
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${(qr.length + 8) * 3}" height="${(qr.length + 8) * 3}" viewBox="0 0 ${qr.length + 8} ${qr.length + 8}" shape-rendering="crispEdges"><path d="${path}"/></svg>`;
            addImage(`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`);
        },
        render: async (): Promise<Buffer[]> => {
            if (line) newLine();
            const window = new BrowserWindow({
                show: false,
                width: RECEIPT_WIDTH,
                height: 600,
                webPreferences: { offscreen: true, nodeIntegration: false, contextIsolation: true, sandbox: true },
            });
            try {
                const html = `<html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"><style>
                    html,body{margin:0;background:white;color:black;width:${RECEIPT_WIDTH}px;overflow:hidden}
                    body{font:20px/30px monospace;overflow-wrap:anywhere}
                    .line{white-space:pre-wrap;min-height:30px}
                </style></head><body>${lines.join("")}</body></html>`;
                await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
                window.webContents.debugger.attach("1.3");
                await window.webContents.debugger.sendCommand("Emulation.setDeviceMetricsOverride", {
                    width: RECEIPT_WIDTH,
                    height: 600,
                    deviceScaleFactor: 1,
                    mobile: false,
                });
                const height: number = await window.webContents.executeJavaScript(`(async () => {
                    await document.fonts.ready;
                    await Promise.all(Array.from(document.images).map(image => image.decode()));
                    return Math.ceil(document.body.getBoundingClientRect().height);
                })()`);
                const images: Buffer[] = [];
                // Bound raster command size and capture long receipts beyond the viewport.
                for (let y = 0; y < height; y += 2048) {
                    const image = await window.webContents.debugger.sendCommand("Page.captureScreenshot", {
                        format: "png",
                        captureBeyondViewport: true,
                        clip: { x: 0, y, width: RECEIPT_WIDTH, height: Math.min(2048, height - y), scale: 1 },
                    });
                    images.push(Buffer.from(image.data, "base64"));
                }
                return images;
            } finally {
                window.destroy();
            }
        },
    };
};
