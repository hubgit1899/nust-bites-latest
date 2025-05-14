import { AlertTriangle, CheckCircle } from "lucide-react";
import { MenuItem } from "@/models/MenuItem";

interface ConfirmUpdateModalProps {
  originalItem: MenuItem;
  updatedItem: MenuItem;
  onConfirm: () => void;
  onCancel: () => void;
  accentColor: string;
}

export const ConfirmUpdateModal = ({
  originalItem,
  updatedItem,
  onConfirm,
  onCancel,
  accentColor,
}: ConfirmUpdateModalProps) => {
  // Function to compare and get differences
  const getDifferences = () => {
    const differences: { field: string; old: any; new: any }[] = [];

    // Compare basic fields
    if (originalItem.name !== updatedItem.name) {
      differences.push({
        field: "Name",
        old: originalItem.name,
        new: updatedItem.name,
      });
    }

    if (originalItem.description !== updatedItem.description) {
      differences.push({
        field: "Description",
        old: originalItem.description,
        new: updatedItem.description,
      });
    }

    if (originalItem.basePrice !== updatedItem.basePrice) {
      differences.push({
        field: "Base Price",
        old: `Rs. ${originalItem.basePrice}`,
        new: `Rs. ${updatedItem.basePrice}`,
      });
    }

    if (originalItem.category !== updatedItem.category) {
      differences.push({
        field: "Category",
        old: originalItem.category,
        new: updatedItem.category,
      });
    }

    if (originalItem.available !== updatedItem.available) {
      differences.push({
        field: "Availability",
        old: originalItem.available ? "Available" : "Not Available",
        new: updatedItem.available ? "Available" : "Not Available",
      });
    }

    if (originalItem.forceOnlineOverride !== updatedItem.forceOnlineOverride) {
      differences.push({
        field: "Online Time Override",
        old: originalItem.forceOnlineOverride ? "Enabled" : "Disabled",
        new: updatedItem.forceOnlineOverride ? "Enabled" : "Disabled",
      });
    }

    // Compare online time if override is enabled
    if (updatedItem.forceOnlineOverride) {
      const originalStart = originalItem.onlineTime?.start || 0;
      const originalEnd = originalItem.onlineTime?.end || 0;
      const newStart = updatedItem.onlineTime?.start || 0;
      const newEnd = updatedItem.onlineTime?.end || 0;

      if (originalStart !== newStart || originalEnd !== newEnd) {
        differences.push({
          field: "Online Time",
          old: `${formatTime(originalStart)} - ${formatTime(originalEnd)}`,
          new: `${formatTime(newStart)} - ${formatTime(newEnd)}`,
        });
      }
    }

    // Compare options
    if (
      JSON.stringify(originalItem.options) !==
      JSON.stringify(updatedItem.options)
    ) {
      differences.push({
        field: "Options",
        old: originalItem.options?.length || 0,
        new: updatedItem.options?.length || 0,
      });
    }

    // Compare image
    if (originalItem.imageURL !== updatedItem.imageURL) {
      differences.push({
        field: "Image",
        old: "Current Image",
        new: "New Image",
      });
    }

    return differences;
  };

  // Helper function to format time
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const differences = getDifferences();

  return (
    <dialog className="modal modal-bottom sm:modal-middle" open>
      <div className="modal-box max-w-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="text-success mb-4">
            <CheckCircle size={48} />
          </div>
          <h3 className="text-lg font-bold mb-2">Confirm Changes</h3>
          <p className="text-base-content/70">
            Please review the changes before updating the menu item.
          </p>
        </div>

        <div className="space-y-4">
          {differences.length > 0 ? (
            differences.map((diff, index) => (
              <div
                key={index}
                className="bg-base-200 rounded-lg p-4 flex flex-col gap-2"
              >
                <div className="font-semibold">{diff.field}</div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex-1">
                    <div className="text-base-content/70">From:</div>
                    <div className="font-medium">{diff.old}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-base-content/70">To:</div>
                    <div className="font-medium">{diff.new}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-base-content/70">
              No changes detected
            </div>
          )}
        </div>

        <div className="modal-action">
          <form method="dialog" className="flex gap-2 w-full">
            <button className="btn btn-secondary flex-1" onClick={onCancel}>
              Cancel
            </button>
            <button
              className="btn flex-1 gap-2"
              onClick={onConfirm}
              style={{
                backgroundColor: accentColor,
                borderColor: accentColor,
                color: "white",
              }}
            >
              <CheckCircle size={16} />
              Confirm Update
            </button>
          </form>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onCancel}>close</button>
      </form>
    </dialog>
  );
};

export default ConfirmUpdateModal;
