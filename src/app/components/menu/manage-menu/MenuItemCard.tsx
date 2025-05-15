import {
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  Info,
  Wifi,
  WifiOff,
} from "lucide-react";
import { formatTime } from "@/helpers/localTime";
import { MenuItem } from "@/models/MenuItem";
import hexToRGBA from "@/lib/hexToRGBA";
import ViewMenuItem from "./ViewMenuItem";
import Image from "next/image";
import { EditMenuItemModal } from "./EditMenuItemModal";
import { DeleteMenuItemModal } from "./DeleteMenuItemModal";
import { useState } from "react";

interface Category {
  name: string;
  count: number;
}

interface MenuItemCardProps {
  item: MenuItem;
  accentColor: string;
  categories: Category[];
  onUpdate?: (updatedItem: MenuItem) => void;
  onDelete?: (deletedItem: MenuItem) => void;
}

export default function MenuItemCard({
  item,
  accentColor,
  categories,
  onUpdate,
  onDelete,
}: MenuItemCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(item);

  const handleUpdate = (updatedItem: MenuItem) => {
    setCurrentItem(updatedItem);
    if (onUpdate) {
      onUpdate(updatedItem);
    }
    setIsEditModalOpen(false);
  };

  const handleDelete = (deletedItem: MenuItem) => {
    if (onDelete) {
      onDelete(deletedItem);
    }
    setIsDeleteModalOpen(false);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  return (
    <>
      <div className="card card-border bg-base-200 border-base-300 card-sm overflow-hidden">
        <figure className="px-2.5 pt-2.5">
          <div className="relative inline-block">
            <Image
              src={currentItem.imageURL}
              alt={currentItem.name}
              width={300}
              height={200}
              className="rounded-xl bg-base-300"
            />
            <div
              className="absolute top-2 right-2 tooltip tooltip-bottom"
              data-tip={currentItem.online ? "Online" : "Offline"}
            >
              <div className="bg-base-100 rounded-full p-1 shadow-md">
                {currentItem.online ? (
                  <Wifi size={16} className="text-success" />
                ) : (
                  <WifiOff size={16} className="text-error" />
                )}
              </div>
            </div>
          </div>
        </figure>

        <div className="card-body">
          <div className="flex justify-between items-start">
            <h2 className="card-title text-sm md:text-md truncate pr-2 overflow-hidden">
              {currentItem.name}
            </h2>

            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-xs pr-0 border-none hover:bg-transparent hover:text-inherit"
              >
                <MoreVertical size={16} />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-32"
              >
                <li>
                  <button
                    className="gap-2 w-full text-left"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <Edit size={16} /> Edit
                  </button>
                </li>
                <li>
                  <button
                    className="text-error gap-2"
                    onClick={() => setIsDeleteModalOpen(true)}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div
            className="badge badge-xs sm:badge-sm truncate max-w-full overflow-hidden text-xs border-none"
            style={{
              backgroundColor: hexToRGBA(accentColor, 0.3),
              color: "white",
            }}
          >
            {currentItem.category}
          </div>

          <p className="line-clamp-2 min-h-[2rem]">{currentItem.description}</p>

          <div className="card-actions flex justify-between items-center gap-x-2 md:gap-x-4 mt-2 flex-nowrap min-w-0">
            <span className="text-sm md:text-md lg:text-lg font-bold truncate">
              Rs. {currentItem.basePrice}
            </span>
            <ViewMenuItem menuItem={currentItem} accentColor={accentColor} />
          </div>

          {/* New section with different background and availability toggle */}
          <div className="-mx-4 -mb-4 p-3 bg-base-300">
            {/* Info section with fixed height to maintain consistency */}
            <div className="flex flex-col min-h-[2rem] mt-1 mb-2 gap-y-1">
              <div className="overflow-hidden text-xs text-base-content/60">
                <div className="flex items-center gap-1 truncate">
                  <Info size={14} />
                  <span className="truncate">
                    {currentItem.options && currentItem.options.length > 0
                      ? `${currentItem.options.length} option${currentItem.options.length > 1 ? "s" : ""}`
                      : "No item options"}
                  </span>
                </div>
              </div>

              <div className="overflow-hidden text-xs text-base-content/60">
                <div className="flex items-center gap-1 truncate">
                  <Clock size={14} />
                  <span className="truncate">
                    {currentItem.forceOnlineOverride && currentItem.onlineTime
                      ? `${formatTime(currentItem.onlineTime.start)} - ${formatTime(currentItem.onlineTime.end)}`
                      : "Follows restaurant schedule"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <EditMenuItemModal
          menuItem={currentItem}
          categories={categories}
          accentColor={accentColor}
          onSuccess={handleUpdate}
          onClose={handleCloseEditModal}
        />
      )}

      {isDeleteModalOpen && (
        <DeleteMenuItemModal
          menuItem={currentItem}
          onSuccess={handleDelete}
          onClose={handleCloseDeleteModal}
        />
      )}
    </>
  );
}
