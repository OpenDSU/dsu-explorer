import constants from "../../../constants.js";

const deleteViewModel = {
    title: "Notification",
    notificationMessage: `Are you sure you want to delete ${constants.DELETE_ITEMS_PLACEHOLDER}?`,
    buttons: {
        cancelButton: {
            label: "Cancel",
            eventName: "delete",
            eventData: "cancel-delete",
            buttonClass: "btn-confirm-secondary",
        },
        deleteButton: {
            label: "Delete",
            eventName: "delete",
            eventData: "confirm-delete",
            buttonClass: "btn-confirm-primary",
        },
    },
    conditionalExpressions: {
        isLoading: false,
    }
};

export default deleteViewModel;
