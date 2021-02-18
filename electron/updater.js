const {dialog} = require("electron");
const {autoUpdater } = require("electron-updater");

autoUpdater.logger = require("electron-log");
autoUpdater.logger.transports.file.level = "info";

autoUpdater.autoDownload = false;

module.exports = () => {

    autoUpdater.checkForUpdates();

    autoUpdater.on('update-available', () => {

        dialog.showMessageBox({
            type: 'info',
            title: 'Update Available',
            message: 'A new version of Tabin is available. Do you want to update now?',
            buttons: ["Update", "No"]
        }, buttonIndex => {
            if(buttonIndex === 0) autoUpdater.downloadUpdate();
        })
    })

    // autoUpdater.on('update-downloaded', () => {

    //     dialog.showMessageBox({
    //         type: 'info',
    //         title: 'Update ready',
    //         message: 'Install and update now?',
    //         buttons: ["Update", "No"]

    //     })
    // })
}
