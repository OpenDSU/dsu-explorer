import ContainerController from "../../cardinal/controllers/base-controllers/ContainerController.js";

import { getDossierServiceInstance } from "../service/DossierExplorerService.js"
import { getAccountServiceInstance } from "../service/AccountService.js";

import signOutViewModel from "../view-models/modals/signOutViewModel.js";

const DossierExplorerService = getDossierServiceInstance();
const MARKETPLACES_FOLDER = "/marketplaces";
const APPS_FOLDER = "/apps/psk-marketplace-ssapp/my-apps";

const appTemplate = {
    exact: false,
    component: "psk-ssapp",
    componentProps: {}
};

export default class DossierExplorerWalletController extends ContainerController {
    constructor(element, history) {
        super(element, history);

        this.ssappName = element.getAttribute('data-ssapp-name');

        element.addEventListener("sign-out", this._signOutFromWalletHandler);
        element.addEventListener("getSSApps", this._getSSAppsHandler);
        element.addEventListener("getMarketplaces", this._getMarketplacesHandler);
        debugger
        this.model = this.setModel({});
        this._setKeySSI();
    }

    _getSSAppsHandler = (event) => {
        debugger
        if (typeof event.getEventType === "function" &&
            event.getEventType() === "PSK_SUB_MENU_EVT") {

            let callback = event.data.callback;
            let pathPrefix = event.data.pathPrefix;
            if (typeof callback !== "function") {
                throw new Error("Callback should be a function");
            }

            DossierExplorerService.readDirDetailed(APPS_FOLDER, (err, {mounts}) => {
                if (err) {
                    return callback(err);
                }

                let auxApps = [];

                let chain = (mounts) => {
                    if (mounts.length === 0) {
                        return callback(err, auxApps);
                    }
                    let mountedApp = mounts.shift();
                    let path = APPS_FOLDER + '/' + mountedApp;

                    let app = JSON.parse(JSON.stringify(appTemplate));
                    app.path = pathPrefix + '/' + mountedApp;

                    this.DSUStorage.getObject(path + '/data', (err, data) => {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        app.name = data.name;
                        app.componentProps.appName = mountedApp;
                        app.componentProps.keySSI = data.keySSI;
                        auxApps.push({...app});
                        chain(mounts);
                    });
                }
                chain(mounts);
            });
        }
    }

    _getMarketplacesHandler = (event) => {
        debugger;
        if (typeof event.getEventType === "function" &&
            event.getEventType() === "PSK_SUB_MENU_EVT") {

            let callback = event.data.callback;
            let pathPrefix = event.data.pathPrefix;
            if (typeof callback !== "function") {
                throw new Error("Callback should be a function");
            }

            DossierExplorerService.readDirDetailed(MARKETPLACES_FOLDER, (err, data) => {
                if (err) {
                    return callback(err);
                }
                let mounts = data.applications;

                let auxApps = [];

                let chain = (applications) => {
                    if (applications.length === 0) {
                        return callback(err, auxApps);
                    }
                    let mountedApp = applications.shift();
                    let path = MARKETPLACES_FOLDER + '/' + mountedApp;

                    this.DSUStorage.getObject(path + '/data', (err, data) => {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        let app = JSON.parse(JSON.stringify(appTemplate));
                        app.path = pathPrefix + '/' + data.keySSI;
                        app.name = data.name;
                        auxApps.push({...app});
                        chain(applications);
                    });
                }
                chain(mounts);
            });
        }
    }

    _signOutFromWalletHandler = (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();

        this.showModal("signOutModal", signOutViewModel, (err, preferences) => {
            if (!err) {
                getAccountServiceInstance().signOut(preferences);
            }
        });
    };

    _setKeySSI = () => {
        DossierExplorerService.printDossierSeed("/apps", this.ssappName, (err, keySSI) => {
            if (err) {
                return console.error(err);
            }

            this.model.setChainValue("keySSI", keySSI);
        });
    }
}