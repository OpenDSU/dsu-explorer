const basePagesPath = "/pages/Wallet/";

const pageLoader = {
    walletContent: `${basePagesPath}wallet-content.html`
};

const rootModel = {
    pageLoader: {
        ...pageLoader
    },
    contentTypesToDisplay: ["applications", "mounts", "folders", "files"],
    content: [],
    navigationLinks: [],
    pageTitle: "Explorer",
    currentPath: '/',
    dateFormatOptions: {
        date: 'dd-mm-yyyy',
        time: 'HH:MM',
        fullTime: 'dd-mm-yyyy HH:MM'
    },
    contentLabels: {
        myWalletLabel: "My Wallet",
        lastModifiedLabel: "Last modification",
        typeLabel: "Type",
        nameLabel: "Name",
        noItemsLabel: "There are no items in the current folder/dossier. You can add some by using the Add button.",
        deleteLabel: "Delete",
        viewFileLabel: "View File",
        downloadFileLabel: "Download",
        shareDossierLabel: "Share"
    },
    addMenuLabels: {
        addLabel: "Add",
        newFile: "New file",
        newFolder: "New folder",
        addFileLabel: "Upload file",
        addFolderLabel: "Upload folder",
        createDossierLabel: "Create Dossier",
        receiveDossierLabel: "Receive Dossier",
    },
    hoverLabels: {
        switchGridHover: "Click to switch to list",
        switchListHover: "Click to switch to grid",
    },
    iconsMenuMoreOptions: [{
            label: "Move",
            eventName: 'move-dossier',
            icon: "arrow-right"
        },
        {
            label: "Rename",
            eventName: 'rename-dossier',
            icon: "pencil"
        }
    ],
    error: {
        hasError: false,
        errorMessage: '',
        noFileUploadedLabel: 'No file or folder was uploaded',
        genericErrorLabel: "There was an unknown problem, please try again. If the error persists, please contact the support team!",
        manifestManipulationError: "manifest file is not available for this kind of operation!"
    },
    conditionalExpressions: {
        isLoading: false,
        isGridLayout: false,
    }
};

export default rootModel;