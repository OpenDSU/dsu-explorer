import ModalController from "../../../cardinal/controllers/base-controllers/ModalController.js";
import FeedbackController from "../FeedbackController.js";
import {
    getDossierServiceInstance
} from "../../service/DossierExplorerService.js";
import Constants from "../Constants.js";

export default class CreateDossierController extends ModalController {
    constructor(element, history) {
        super(element, history);

        this.dossierService = getDossierServiceInstance();
        this.feedbackController = new FeedbackController(this.model);

        this._initListeners();
    }

    _initListeners = () => {
        this.on('name-new-dossier', this._setNameForNewDossier);
        this.on('new-dossier-seed-received', this._finishNewDossierProcess);

        this.model.onChange("dossierNameInput.value", this._validateInput);
    };

    _setNameForNewDossier = (event) => {
        event.stopImmediatePropagation();
        this.feedbackController.updateDisplayedMessage(Constants.ERROR);

        if (!this._validateInput()) {
            return;
        }

        this.feedbackController.setLoadingState(true);
        const wDir = this.model.currentPath || '/';
        let dossierName = this.model.dossierNameInput.value;
        this.dossierService.readDir(wDir, (err, dirContent) => {
            if (err) {
                this.feedbackController.setLoadingState();
                this.feedbackController.updateDisplayedMessage(Constants.ERROR, err);
            } else {
                if (dirContent.find((el) => el.path === dossierName)) {
                    this.feedbackController.setLoadingState();
                    this.feedbackController.updateDisplayedMessage(Constants.ERROR, this.model.error.labels.entryExists);
                } else {
                    this._createDossier(dossierName);
                }
            }
        });
    };

    _createDossier = (dossierName) => {
        let wDir = this.model.currentPath || '/';
        if (wDir == '/') {
            wDir = '';
        }

        this.dossierService.createDossier(wDir, dossierName, (err, outputSEED) => {
            this.feedbackController.setLoadingState();
            if (err) {
                console.log(err);
                this.feedbackController.updateDisplayedMessage(Constants.ERROR, err);
            } else {
                this.model.dossierSeedOutput.value = outputSEED;
                this.model.conditionalExpressions.isDossierNameStep = false;
            }
        });
    }

    _finishNewDossierProcess = (event) => {
        event.stopImmediatePropagation();

        this.responseCallback(undefined, {
            success: true
        });
    };

    _validateInput = () => {
        this.feedbackController.updateDisplayedMessage(Constants.ERROR);

        const value = this.model.dossierNameInput.value;
        const isEmptyName = value.trim().length === 0;
        const hasWhiteSpaces = value.replace(/\s/g, '') !== value;
        this.model.setChainValue('buttons.createDossier.disabled', isEmptyName || hasWhiteSpaces);

        if (isEmptyName || hasWhiteSpaces) {
            this.feedbackController.updateDisplayedMessage(Constants.ERROR, this.model.error.labels.nameNotValid);
            return false;
        }

        return true;
    };
}