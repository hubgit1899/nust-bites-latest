"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerDetailsSchema } from "@/schemas/customerDetailsSchema";
import { z } from "zod";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import axios from "axios";

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomerDetailsModal = ({
  isOpen,
  onClose,
}: CustomerDetailsModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session, update } = useSession();

  const form = useForm<z.infer<typeof customerDetailsSchema>>({
    resolver: zodResolver(customerDetailsSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof customerDetailsSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        "/api/update-user-details-CUSTOMER",
        data
      );

      if (response.data.sessionRevalidated) {
        toast.success("Details updated successfully!");
        const updatedSession = await update();

        if (updatedSession?.user?.isCustomer) {
          onClose();
        }
      } else {
        toast.error(response.data.message || "Failed to update details");
      }
    } catch (error) {
      console.error("Error updating customer details:", error);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      id="customer_details_modal"
      className="modal modal-bottom sm:modal-middle backdrop-blur-xs"
      open
    >
      <fieldset className="modal-box max-w-md fieldset bg-base-200 border-base-300 w-full border  pr-6 pl-6 pb-6">
        <legend className="fieldset-legend text-2xl font-bold">
          Your<span className="text-primary">Details</span>
        </legend>
        <p className="text-sm text-base-content/70 mb-6">
          Please complete your profile details to continue using our services.
        </p>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label text-sm font-semibold">Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              className="input input-bordered w-full"
              {...form.register("fullName")}
              onChange={(e) => {
                form.setValue("fullName", e.target.value);
                form.clearErrors("fullName");
              }}
            />
            {form.formState.errors.fullName && (
              <p className="text-xs text-error mt-1">
                {form.formState.errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <label className="label text-sm font-semibold">Phone Number</label>
            <input
              type="tel"
              placeholder="Enter your phone number"
              className="input input-bordered w-full"
              {...form.register("phoneNumber")}
              onChange={(e) => {
                form.setValue("phoneNumber", e.target.value);
                form.clearErrors("phoneNumber");
              }}
            />
            {form.formState.errors.phoneNumber && (
              <p className="text-xs text-error mt-1">
                {form.formState.errors.phoneNumber.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-neutral w-full mt-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Please wait...
              </>
            ) : (
              "Complete Profile"
            )}
          </button>
        </form>
      </fieldset>
    </dialog>
  );
};

export default CustomerDetailsModal;
