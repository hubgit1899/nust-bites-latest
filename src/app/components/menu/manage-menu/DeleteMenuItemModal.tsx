import { AlertTriangle, Trash2 } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import axios from "axios";
import { MenuItem } from "@/models/MenuItem";

interface DeleteMenuItemModalProps {
  menuItem: MenuItem;
  onSuccess: (deletedItem: MenuItem) => void;
  onClose: () => void;
}

export const DeleteMenuItemModal = ({
  menuItem,
  onSuccess,
  onClose,
}: DeleteMenuItemModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const modalRef = useRef<HTMLDialogElement | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await axios.delete(
        `/api/my-restaurants/delete-menu-item?id=${menuItem._id}`
      );

      if (response.data.success) {
        toast.success("Menu item deleted successfully");
        onSuccess(menuItem);
        if (modalRef.current) {
          modalRef.current.close();
        }
      } else {
        toast.error(response.data.message || "Failed to delete menu item");
      }
    } catch (error) {
      console.error("Error deleting menu item:", error);
      toast.error("Failed to delete menu item");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle" open>
      <div className="modal-box">
        <div className="flex flex-col">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="text-error mb-4">
              <AlertTriangle size={48} />
            </div>
            <h3 className="text-lg font-bold mb-2">Delete Menu Item</h3>
            <p className="text-base-content/70">
              Are you sure you want to delete "{menuItem.name}"? This action
              cannot be undone.
            </p>
          </div>
          <div className="modal-action w-full">
            <form method="dialog" className="w-full flex justify-between gap-4">
              <button
                className="btn btn-secondary"
                disabled={isDeleting}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="btn btn-error gap-2"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

export default DeleteMenuItemModal;
