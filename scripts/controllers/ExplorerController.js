import FileDownloader from "./file-folder-controllers/FileDownloader.js";
import FeedbackController from "./FeedbackController.js";

import rootModel from "../view-models/rootModel.js";

import createDossierViewModel from '../view-models/modals/dossier-modals/createDossierViewModel.js';
import receiveDossierViewModel from '../view-models/modals/dossier-modals/receiveDossierViewModel.js';
import shareDossierViewModel from '../view-models/modals/dossier-modals/shareDossierViewModel.js';

import newFileViewModel from "../view-models/modals/file-folder-modals/newFileViewModel.js";
import newFolderViewModel from "../view-models/modals/file-folder-modals/newFolderViewModel.js";

import deleteViewModel from '../view-models/modals/actions-modals/deleteViewModel.js';
import renameViewModel from '../view-models/modals/actions-modals/renameViewModel.js';
import moveViewModel from '../view-models/modals/actions-modals/moveViewModel.js';

import ExplorerNavigationController from "./ExplorerNavigationController.js";
import constants from "./../constants.js";
import {getNewDossierServiceInstance} from "../service/NewDossierExplorerServiceWallet.js";
import {getNewUserInteractionServiceInstance} from "../service/UserInteractionService.js";

const {loader} = WebCardinal;

const TEXTAREA_ID = 'editor';
const IMG_ID = 'photoViewer';

const {WebcController} = WebCardinal.controllers;
export default class ExplorerController extends WebcController {
  constructor(element, history) {
    super(element, history);
    this.model = this._getCleanProxyObject(rootModel);
    this._init(element, history);
  }

  async _init(element, history) {
    this.dossierService = await getNewDossierServiceInstance();
    this.feedbackController = new FeedbackController(this.model);
    this.explorerNavigator = new ExplorerNavigationController(element, history, this.model);

    this.userInteractionService = await getNewUserInteractionServiceInstance();

    this._initListeners();
    this._checkForLandingApp();
  }

  _initListeners = () => {
    this.model.onChange('currentPath', this.breadcrumbGenerator);
    this.breadcrumbGenerator();

    this.onTagClick('go-to', (model, target, event) => {
      this.model.currentPath = model.path;
      this.refreshUI();
    });

    this.on('openFeedback', (evt) => {
      this.feedbackEmitter = evt.detail;
    });

    this.on("switch-layout", this._handleSwitchLayout);
    this.on('open-options-menu', this._handleOptionsMenu);

    let tableItems = this.element.querySelectorAll(".table-content");

    // event listeners for clicking and double-clicking items from the file system:
    tableItems.forEach((myDiv) => {
      myDiv.addEventListener("click", (event) => {
        if (event.target.classList.contains("table-row")) {
          console.log("The table item was clicked");
          // this should select the element from the table

        }
      });
    });
    tableItems.forEach((myDiv) => {
      myDiv.addEventListener("dblclick", (event) => {
        if (event.target.classList.contains("table-row")) {
          console.log("The table item was double-clicked!");
          let dataType = event.target.getAttribute('data-type');
          if (dataType !== 'file') {
            return this.goTo(event.target.getAttribute('data-name'));
          }
          this._handleViewFile(event);
          // if the double clicked element is a file, this should open the view-file-modal
          // if the double clicked element is a directory/DSU, this should navigate there
        }
      });
    });

    this.onTagClick('context-menu', this.showContextMenu)

    this.onTagClick('view-file', this._handleViewFile);
    // this.on('view-file', this._handleViewFile);
    this.onTagClick('rename', this._renameHandler);

    // this.on('export-dossier', this._handleDownload);
    this.onTagClick('download-file', this._handleDownload);

    this.onTagClick('unmount', this.unmountDSU)

    this.on('share-dossier', this._shareDossierHandler);
    this.on('delete', this._deleteHandler);
    this.on('move', this._moveHandler);
    this.on('close', this._closeHandler)
    this.on('run-app', this._handleRunApplication);

    this.onTagClick('create-file', this._addNewFileHandler);
    this.onTagClick('create-folder', this._addNewFolderHandler);

    this.element.querySelector('#upload-file').addEventListener('change', this._uploadFileHandler);
    this.onTagClick('upload-file', this._triggerFileSelect);
    this.element.querySelector('#upload-folder').addEventListener('change', this._uploadFileHandler);
    this.onTagClick('upload-folder', this._triggerFolderSelect);
    this.onTagClick("add-bdns", this._updateBDNSHandler);
    this.onTagClick('create-dsu', this._createDossierHandler);
    this.onTagClick('receive-dsu', this._receiveDossierHandler);

    this.element.querySelector('#add-menu-options').addEventListener('click', this.toggleAddMenu);
  };

  refreshUI = () => {
    this.explorerNavigator.listDossierContent();
  }

  breadcrumbGenerator = () => {
    if (this.model.currentPath === '/') {
      return this.model.breadcrumbs = [''];
    }
    let segments = this.model.currentPath.split('/');
    let breadcrumb = [];
    let cwd = "";
    for (let i in segments) {
      let segment = segments[i];
      if (segment === "" && i !== "0") {
        continue;
      }
      cwd += segment + '/';
      breadcrumb.push({
        label: segment,
        path: cwd
      });
    }
    this.model.breadcrumbs = breadcrumb;
  }

  goTo = (path) => {
    let cwd = this.model.currentPath || '/';
    if (cwd[cwd.length - 1] !== '/') {
      this.model.currentPath += "/";
    }
    this.model.currentPath += path;
    this.refreshUI();
  }

  _handleOptionsMenu = (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const selectedItem = event.data;

    let itemActionsBtn = this.element.querySelector("#wallet-content-container").shadowRoot.querySelector("#item-actions");

    itemActionsBtn.setAttribute("opened", "");
    this.model.optionsMenu.isApplication = selectedItem.isApplication;
    this.model.optionsMenu.icon = selectedItem.icon;
    this.model.optionsMenu.name = selectedItem.name;
    this.model.optionsMenu.dataType = selectedItem.dataType;
  };

  _closeHandler() {
    let itemActionsBtn = this.element.querySelector("#wallet-content-container").shadowRoot.querySelector("#item-actions");
    itemActionsBtn.removeAttribute("opened");
  }

  _checkForLandingApp() {
    /*this.DSUStorage.getObject("apps/.landingApp", (err, landingApp) => {
        if (!err && landingApp && landingApp.name) {
            this.showModal("runApp", { name: landingApp.name });
            this.dossierService.deleteFileFolder("apps/.landingApp", (err) => {
                if (err) {
                    console.log(err);
                }
            });
        }
    })*/

  }

  _handleRunApplication = (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    let applicationName = event.data;
    let fullPath = this.explorerNavigator.getFullPath();

    this.dossierService.printDossierSeed(fullPath, applicationName, (err, keySSI) => {
      if (err) {
        this.userInteractionService.showError("Error", "Could not print DSU seed.");
        return console.error(err);
      }

      this.showModal("runAppModal", {
        name: applicationName,
        keySSI: keySSI
      }, () => {
        //TODO: what should happen when user closes the app?
      })
    })
  };

  _handleSwitchLayout = (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    this.model.isGridLayout = !this.model.isGridLayout;
  };

  _createDossierHandler = (model, target, event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    let cwd = this.model.currentPath || '/';

    createDossierViewModel.currentPath = cwd;

    this.model.modalState = {cwd};
    let modalOptions = {
      controller: "file-folder-controllers/CreateDossierController",
      model: this.model.modalState,
      disableFooter: true,
      modalTitle: "Create DSU"
    };

    this.model.onChange('modalState.refresh', this.refreshUI);
    this.showModalFromTemplate('create-dossier-modal', this.refreshUI, this.refreshUI, modalOptions);
  };

  _receiveDossierHandler = (model, target, event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    let cwd = this.model.currentPath || '/';

    receiveDossierViewModel.currentPath = cwd;
    this.model.modalState = {cwd};
    let modalOptions = {
      controller: "file-folder-controllers/ReceiveDossierController",
      model: this.model.modalState,
      disableFooter: true,
      modalTitle: "Receive DSU"
    };

    this.model.onChange('modalState.refresh', this.refreshUI);
    this.showModalFromTemplate('receive-dossier-modal', this.refreshUI, this.refreshUI, modalOptions);
  };

  _deleteHandler = (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const {
      currentPath,
      selectedItem
    } = this._getSelectedItemAndWorkingDir(event.data);

    const name = selectedItem.name;
    if (name === 'manifest') {
      return this.feedbackEmitter(this.model.error.labels.manifestManipulationError, null, constants.ERROR_FEEDBACK_TYPE);
    }

    deleteViewModel.path = currentPath;
    deleteViewModel.selectedItemName = selectedItem.name;
    deleteViewModel.selectedItemType = selectedItem.type;

    this.showModal('deleteModal', deleteViewModel, (err, response) => {
      if (err) {
        return this.feedbackEmitter(err, null, constants.ERROR_FEEDBACK_TYPE);
      }

      const successMessage = this.model[constants.SUCCESS].delete
        .replace(constants.NAME_PLACEHOLDER, response.name);
      this.feedbackEmitter(successMessage, null, constants.SUCCESS_FEEDBACK_TYPE);
      this.explorerNavigator.listDossierContent();
    });
  };

  _renameHandler = (model, target, event) => {
    // event.preventDefault();
    event.stopImmediatePropagation();

    let cwd = this.model.currentPath || '/';
    let filename = model.name;

    renameViewModel.currentPath = cwd;

    this.model.modalState = {cwd, filename};
    let modalOptions = {
      controller: "file-folder-controllers/RenameController",
      model: this.model.modalState,
      modalTitle: "Rename"
    };

    this.model.onChange('modalState.refresh', this.refreshUI);
    this.showModalFromTemplate('rename-modal', this.refreshUI, this.refreshUI, modalOptions);

    // const {
    //     currentPath,
    //     selectedItem
    // } = this._getSelectedItemAndWorkingDir(event.data);
    //
    // const name = selectedItem.name;
    // if (name === 'manifest') {
    //     return this.feedbackEmitter(this.model.error.labels.manifestManipulationError, null, constants.ERROR_FEEDBACK_TYPE);
    // }
    //
    // renameViewModel.fileNameInput.value = name;
    // renameViewModel.oldFileName = name;
    // renameViewModel.fileType = selectedItem.type;
    // renameViewModel.currentPath = currentPath;
    //
    // this.showModal('renameModal', renameViewModel, (err, response) => {
    //     if (err) {
    //         return this.feedbackEmitter(err, null, constants.ERROR_FEEDBACK_TYPE);
    //     }
    //
    //     if (!response.cancel) {
    //         const successMessage = this.model[constants.SUCCESS].rename
    //             .replace(constants.FROM_PLACEHOLDER, response.from)
    //             .replace(constants.TO_PLACEHOLDER, response.to);
    //         this.feedbackEmitter(successMessage, null, constants.SUCCESS_FEEDBACK_TYPE);
    //         this.explorerNavigator.listDossierContent();
    //     }
    // });
  };

  _moveHandler = (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const {
      currentPath,
      selectedItem
    } = this._getSelectedItemAndWorkingDir(event.data);

    if (selectedItem.name === 'manifest') {
      return this.feedbackEmitter(this.model.error.labels.manifestManipulationError, null, constants.ERROR_FEEDBACK_TYPE);
    }

    moveViewModel.selectedEntryName = selectedItem.name;
    moveViewModel.selectedEntryType = selectedItem.type;
    moveViewModel.currentWorkingDirectory = currentPath;
    moveViewModel.dateFormatOptions = this._getCleanProxyObject(this.model.dateFormatOptions);
    moveViewModel.contentLabels = {
      ...this.model.contentLabels,
      ...moveViewModel.contentLabels,
    };

    this.showModal('moveModal', moveViewModel, (err, response) => {
      if (err) {
        return this.feedbackEmitter(err, null, constants.ERROR_FEEDBACK_TYPE);
      }

      if (!response.cancel) {
        const successMessage = this.model[constants.SUCCESS].move
          .replace(constants.NAME_PLACEHOLDER, response.name)
          .replace(constants.FROM_PLACEHOLDER, response.from)
          .replace(constants.TO_PLACEHOLDER, response.to);
        this.feedbackEmitter(successMessage, null, constants.SUCCESS_FEEDBACK_TYPE);
        this.explorerNavigator.listDossierContent();
      }
    });
  };

  _shareDossierHandler = (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const {
      currentPath,
      selectedItem
    } = this._getSelectedItemAndWorkingDir(event.data);

    shareDossierViewModel.currentPath = currentPath;
    shareDossierViewModel.selectedFile = selectedItem.name;

    this.showModal('shareDossierModal', shareDossierViewModel, (err) => {
      if (err) {
        this.feedbackEmitter(err, null, constants.ERROR_FEEDBACK_TYPE);
      }
    });
  };

  _addNewFileHandler = (model, target, event) => {
    event.stopImmediatePropagation();

    let cwd = this.model.currentPath || '/';

    newFileViewModel.currentPath = cwd;

    this.model.modalState = {cwd};
    let modalOptions = {
      controller: "file-folder-controllers/NewFileController",
      model: this.model.modalState,
      modalTitle: "Create new file"
    };

    this.model.onChange('modalState.refresh', this.refreshUI);
    this.showModalFromTemplate('new-file-modal', this.refreshUI, this.refreshUI, modalOptions);
  };

  _updateBDNSHandler = (model, target, event) => {
    event.stopImmediatePropagation();

    this.model.modalState = {userInteractionService: this.userInteractionService, refreshUI: this.refreshUI};
    let modalOptions = {
      controller: "modals/BDNSController",
      model: this.model.modalState,
      modalTitle: "Update BDNS"
    };

    this.model.onChange('modalState.refresh', this.refreshUI);
    this.showModalFromTemplate('add-bdns-modal', this.refreshUI, this.refreshUI, modalOptions);

  }

  _addNewFolderHandler = (model, target, event) => {
    event.stopImmediatePropagation();

    let cwd = this.model.currentPath || '/';

    newFolderViewModel.currentPath = cwd;

    this.model.modalState = {cwd};
    let modalOptions = {
      controller: "file-folder-controllers/NewFolderController",
      model: this.model.modalState,
      modalTitle: "Create new folder"
    };

    this.model.onChange('modalState.refresh', this.refreshUI);
    this.showModalFromTemplate('new-folder-modal', this.refreshUI, this.refreshUI, modalOptions);
  };

  _triggerFileSelect = (model, target, event) => {
    event.stopImmediatePropagation();
    let fileSelect = this.element.querySelector('#upload-file');
    fileSelect.value = '';
    fileSelect.click();
  }

  reader = (file) => {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = (err) => reject(err);
      fr.readAsBinaryString(file);
    })
  }

  _uploadFileHandler = async (event) => {
    let cwd = this.model.currentPath || '/';

    newFolderViewModel.currentPath = cwd;

    let files = event.target.files;
    if (files.length === 0) {
      return;
    }

    let filePath = cwd;
    if (filePath[filePath.length - 1] !== '/') {
      filePath += '/';
    }

    // create file:
    loader.hidden = false;
    this.service = await getNewDossierServiceInstance();

    for (let file of files) {
      let fileName = file.webkitRelativePath || file.name;
      let writeFileAsync = $$.promisify(this.service.writeFile, this.service);
      try {
        let fileContent = await this.reader(file);
        await writeFileAsync(filePath + fileName, fileContent);
      } catch (err) {
        if (err) {
          // display warning for user in UI
          this.userInteractionService.showError("Error", "Failed to upload file.");
        }
      }
    }
    // await this.service.commitBatchAsync();

    loader.hidden = true;
    console.log("saved"); // display message for user in UI
    this.refreshUI();
  }

  _triggerFolderSelect = (model, target, event) => {
    event.stopImmediatePropagation();
    let folderSelect = this.element.querySelector('#upload-folder');
    folderSelect.value = '';
    folderSelect.click();
  }

  isImage(filename) {
    const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".jfif", ".pjpeg", ".pjp", ".svg", ".webp", ".bmp", ".ico"];
    for (const extension of imageExtensions) {
      if (filename.endsWith(extension)) {
        return true;
      }
    }
    return false;
  }

  async getFile(filename) {
    this.service = await getNewDossierServiceInstance();
    let readFileAsync = $$.promisify(this.service.readFile, this.service);
    return readFileAsync(filename);
  }

  getMimeSubtype(filename) {
    return filename.split('.').pop();
  }

  convertToDataURL(data, subtype) {
    return "data:image/" + subtype + ";base64," + btoa(data);
  }

  _handleDownload = async (selectedItem) => {
    let selectedItemName = selectedItem.name;

    const fileContent = await this.getFile(selectedItemName);
    const link = document.createElement('a');

    if (this.isImage(selectedItemName)) {
      link.href = this.convertToDataURL(fileContent, this.getMimeSubtype(selectedItemName));
    } else {
      let data = new Blob([fileContent], {type: "application/octet-stream"});
      link.href = URL.createObjectURL(data);
    }

    link.setAttribute('download', selectedItemName);
    link.setAttribute('style', 'display:none');
    this.element.appendChild(link);

    link.click();


    // event.preventDefault();
    // event.stopImmediatePropagation();
    //
    // const selectedItem = this._getSelectedItem(event.data);
    // if (!selectedItem) {
    //     console.error(`No item selected to be downloaded!`);
    //     return;
    // }
    //
    // const itemViewModel = this._getCleanProxyObject(selectedItem);
    // if (itemViewModel.type === 'file') {
    //     this._handleDownloadFile(this.model.currentPath, itemViewModel.name);
    // }
  };

  _handleDownloadFile(path, fileName) {
    let fileDownloader = new FileDownloader(path, fileName);
    fileDownloader.downloadFile();
  }

  unmountDSU = async (model, target, event) => {
    this.service = await getNewDossierServiceInstance();
    let selectedItemName = model.name;

    let cwd = this.model.currentPath || '/'
    // cwd += selectedItemName;
    this.service.unmountDSU(cwd, selectedItemName, (err, res) => {
      if (err) {
        this.userInteractionService.showError("Error", "An error occurred during the unmount DSU operation.");
        return;
      }
      this.refreshUI();
    })
  }

  showContextMenu = (model, target, event) => {
    console.log('clicked on context menu');
    if (!event) {
      //this is click event from file type inputs
      event = model;
      if (event.target.type === "file") {
        return;
      }
    }
    this.element.querySelectorAll(".context-menu").forEach(element => {
      if (!element.classList.contains("hidden")) {
        element.classList.add("hidden");
      }
    });

    let contextMenu = this.element.querySelector(`div[name="${model.name}"]`);
    contextMenu.classList.toggle("hidden");
  }

  _handleViewFile = (model, target, event) => {
    let selectedItemName;
    if (!event) {   // if the _handleViewFile function is triggered by double-clicking the file
      event = model;
      event.preventDefault();
      event.stopImmediatePropagation();
      selectedItemName = event.target.querySelector('.item-name').textContent;
    } else {          // if the _handleViewFile function is triggered by the context menu "View file" button
      selectedItemName = model.name;
    }

    const {currentPath, selectedItem} = this._getSelectedItemAndWorkingDir(selectedItemName);
    if (!selectedItem) {
      console.error(`No item selected to be downloaded!`);
      return;
    }

    const itemViewModel = this._getCleanProxyObject(selectedItem);
    if (itemViewModel.type !== 'file') {
      console.error(`Only files support this funtionality!`);
      return;
    }

    itemViewModel.currentPath = currentPath;
    this.explorerNavigator.openViewFileModal(itemViewModel);
  };

  _getSelectedItemAndWorkingDir = (name) => {
    if (!this.model.content.length) {
      this.userInteractionService.showError("Error", "No content available.");
      return;
    }

    const selectedItem = this._getSelectedItem(name);
    if (!selectedItem) {
      this.userInteractionService.showError("Error", "No item selected!");
      return;
    }

    return {
      currentPath: this.model.currentPath,
      selectedItem: this._getCleanProxyObject(selectedItem)
    };
  };

  _getSelectedItem = (name) => {
    return this.model.content.find((el) => el.name === name);
  };

  _getCleanProxyObject = (obj) => {
    return obj ? JSON.parse(JSON.stringify(obj)) : null;
  }

  toggleAddMenu = (model, target, event) => {
    if (!event) {
      //this is click event from file type inputs
      event = model;
      if (event.target.type === "file") {
        return;
      }
    }
  }
}
