/**
 * @author v1ndic4te
 * @copyright 2018
 * @licence GPL-3.0
 */

const EventEmitter = require('events');

const {SortOrder} = require('../components/helpers/SortPicker');
const {View} = require('../components/helpers/ViewPicker');

const StateProps = {
    EnvSummariesChanged: 'env-sum-change',
    EnvSort: 'env-sort',
    EnvView: 'env-view',
};

class PropEmitter extends EventEmitter {
}

class GlobalState {

    constructor() {
        if (!window.dataManager) throw new Error('DataManager should be initialised before GlobalState!');

        this.propValues = {
            [StateProps.EnvSummariesChanged]: true,
            [StateProps.EnvSort]: SortOrder.Name,
            [StateProps.EnvView]: View.ListColumns,
        };
        this.propEmitter = new PropEmitter();
    }

    ensure(propName, action) {
        if (this.propValues[propName] === undefined)
            throw new Error(`Tried to ${action} an unknown global state prop: ${propName}`);
    }

    set(propName, propValue) {
        this.ensure(propName, 'set');
        this.propValues[propName] = propValue;
        this.propEmitter.emit(propName, propName, propValue);
    }

    get(propName) {
        this.ensure(propName, 'get');
        return this.propValues[propName];
    }

    /**
     * @param {string} propName
     */
    notify(propName) {
        this.ensure(propName);
        this.propEmitter.emit(propName, propName, this.propValues[propName]);
    }

    /**
     * @param {string} propName
     * @param {function(string, any)} listener
     * @param {boolean} notify
     */
    addListener(propName, listener, notify = true) {
        this.ensure(propName, 'add listener to');
        this.propEmitter.addListener(propName, listener);
        if (notify) listener(propName, this.propValues[propName]);
    }

    /**
     * @param {string} propName
     * @param {function(string, any)} listener
     */
    removeListener(propName, listener) {
        this.propEmitter.removeListener(propName, listener);
    }

}

module.exports = GlobalState;
module.exports.StateProps = StateProps;
