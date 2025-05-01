"use client";
import { verifySchema } from "@/schemas/verifySchema";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { ApiResponse } from "@/types/ApiResponse";
import { Loader2 } from "lucide-react";

const page = () => {
  const router = useRouter();
  const params = useParams<{ username: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  //zod implementation
  const form = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
  });

  const onSubmit = async (data: z.infer<typeof verifySchema>) => {
    setIsSubmitting(true);

    try {
      const response = await axios.post("/api/verify-code", {
        username: params.username,
        code: data.code,
      });

      toast.success("Verify Success", {
        description: response.data.message,
      });
      router.replace(`/sign-in`);
    } catch (error) {
      console.log("Error in signup of user", error);
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error("Verification failed", {
        description: axiosError.response?.data.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div
      className="flex justify-center items-center"
      style={{ height: "calc(100vh - var(--navbar-height) - 100px)" }}
    >
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-full max-w-md border p-6">
        <legend className="fieldset-legend text-2xl font-bold">Verify</legend>
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-2">
          Verify Your Account
        </h1>
        <p className="text-sm">
          Enter the verification code sent to your email.
        </p>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="label text-sm font-semibold">
              Verification Code
            </label>
            <input
              type="text"
              placeholder="Enter code"
              className="input input-bordered w-full mt-1"
              {...form.register("code")}
              onChange={(e) => {
                form.setValue("code", e.target.value);
                form.clearErrors("code");
              }}
            />
            {form.formState.errors.code && (
              <p className="text-xs text-error mt-2">
                {form.formState.errors.code.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-neutral w-full mt-4"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait...
              </>
            ) : (
              "Verify"
            )}
          </button>
        </form>
      </fieldset>
    </div>
  );
};

export default page;
