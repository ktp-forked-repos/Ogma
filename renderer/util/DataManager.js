/**
 * @author v1ndic4te
 * @copyright 2018
 * @licence GPL-3.0
 */

const Promise = require('bluebird');

const IpcModule = require('../../shared/IpcModule');
const FileManager = require('./FileManager');

class DataManager {

    constructor() {
        this.ipcModule = null;

        this.settings = null;

        this.envIds = [];
        this.envSummaries = [];
        this.envSummaryMap = {};

        this.fileManagerMap = {};
    }

    init() {
        return Promise.resolve()
            .then(() => {
                this.ipcModule = new IpcModule({mode: 'client'});
                this.ipcModule.init();
            })
            .then(() => this._refreshSettings())
            .then(() => this._refreshEnvSummaries());
    }

    _refreshSettings() {
        return this.ipcModule.getSettings()
            .then(settings => this.settings = settings);
    }

    /**
     * @returns {SettingsData}
     */
    getSettings() {
        return this.settings;
    }

    /**
     * @param {Setting} name
     * @returns {string}
     */
    getSetting(name) {
        return this.settings[name];
    }

    /**
     * @param {Setting} name
     * @param {string} value
     * @returns {Promise<void>}
     */
    setSetting(name, value) {
        return this.ipcModule.setSetting({name, value})
            .then(() => {
                // Update the in-place copy if no error have occurred during communication.
                this.settings[name] = value;
            });
    }

    _refreshEnvSummaries() {
        return this.ipcModule.getEnvSummaries()
            .then(envSummaries => {
                const envIds = [];
                const envSummaryMap = {};
                const fileManagerMap = {};
                for (const summary of envSummaries) {
                    envIds.push(summary.id);
                    envSummaryMap[summary.id] = summary;
                    fileManagerMap[summary.id] = this.fileManagerMap[summary.id];
                }
                this.envIds = envIds;
                this.envSummaries = envSummaries;
                this.envSummaryMap = envSummaryMap;
                this.fileManagerMap = fileManagerMap;
            });
    }

    getEnvIds() {
        return this.envIds;
    }

    getEnvSummaries() {
        return this.envSummaries;
    }

    /**
     * @param {object} data
     * @param {string} data.id
     * @returns {EnvSummary}
     */
    getEnvSummary(data) {
        return this.envSummaryMap[data.id];
    }

    /**
     * @param {object} data
     * @param {string} data.envId
     * @param {EnvProperty} data.name
     * @param {string} data.value
     */
    setEnvProperty(data) {
        return this.ipcModule.setEnvProperty({envId: data.envId, name: data.name, value: data.value})
            .then(() => {
                // Update the in-place copy if no error have occurred during communication.
                this.envSummaryMap[data.envId][data.name] = data.value;
            });
    }

    /**
     * @param {object} data
     * @param {string} data.envId
     */
    getFileManager(data) {
        if (!this.fileManagerMap[data.envId]) {
            const envSummary = this.envSummaryMap[data.envId];
            if (!envSummary) throw new Error(`Can't create a file manager - environment \
            '${data.envId}' does not exist!`);

            this.fileManagerMap[data.envId] = new FileManager({envSummary});
        }
        return this.fileManagerMap[data.envId];
    }

}

module.exports = DataManager;
