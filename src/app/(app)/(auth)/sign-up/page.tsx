"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useDebounceCallback } from "usehooks-ts";
import { toast } from "sonner";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signupSchema } from "@/schemas/signupSchema";
import axios, { AxiosError } from "axios";
import { ApiResponse } from "@/types/ApiResponse";
import { Loader2 } from "lucide-react";

const page = () => {
  const [username, setUsername] = useState("");
  const [usernameMessage, setUsernameMessage] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debounced = useDebounceCallback(setUsername, 300);

  const router = useRouter();

  //zod implementation
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const checkUsernameUnique = async () => {
      if (username.length > 0) {
        setIsCheckingUsername(true);
        setUsernameMessage("");
        try {
          const response = await axios.get(
            `/api/check-username-unique?username=${username}`
          );
          setUsernameMessage(response.data.message);
        } catch (error) {
          const axiosError = error as AxiosError<ApiResponse>;
          setUsernameMessage(
            axiosError.response?.data.message ?? "Error checking username"
          );
        } finally {
          setIsCheckingUsername(false);
        }
      } else {
        setUsernameMessage("");
      }
    };
    checkUsernameUnique();
  }, [username]);

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post<ApiResponse>("/api/sign-up", data);

      toast.success("Signup Success", {
        description: response.data.message,
      });

      router.replace(`/verify/${username}`);
    } catch (error) {
      console.log("Error in signup of user", error);
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error("Signup Failed", {
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
        <legend className="fieldset-legend text-3xl font-bold">
          Sign<span className="text-primary">Up</span>
        </legend>{" "}
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-2">
          Welcome to nustbites
        </h1>
        <p className="text-sm">
          Register yourself to enjoy the best food delivery experience.
        </p>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="label text-sm font-semibold">Username</label>
            <input
              type="text"
              className="input input-bordered w-full mt-1"
              placeholder="Username"
              {...form.register("username")}
              onChange={(e) => {
                form.setValue("username", e.target.value);
                debounced(e.target.value);
                form.clearErrors("username");
              }}
            />
            {isCheckingUsername && (
              <Loader2 className="animate-spin w-4 h-4 mt-2" />
            )}
            {usernameMessage && (
              <p
                className={`text-xs mt-2 ${
                  usernameMessage === "Username is unique"
                    ? "text-success"
                    : "text-error"
                }`}
              >
                {usernameMessage}
              </p>
            )}
            {form.formState.errors.username && (
              <p className="text-xs text-error mt-2">
                {form.formState.errors.username.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="label text-sm font-semibold">Email</label>
            <input
              type="email"
              placeholder="Email"
              className="input input-bordered w-full mt-1"
              {...form.register("email")}
              onChange={(e) => {
                form.setValue("email", e.target.value);
                form.clearErrors("email");
              }}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-error mt-2">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="label text-sm font-semibold">Password</label>
            <input
              type="password"
              placeholder="Password"
              className="input input-bordered w-full mt-1"
              {...form.register("password")}
              onChange={(e) => {
                form.setValue("password", e.target.value);
                form.clearErrors("password");
              }}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-error mt-2">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="label text-sm font-semibold">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Re-enter your password"
              className="input input-bordered w-full mt-1"
              {...form.register("confirmPassword")}
              onChange={(e) => {
                form.setValue("confirmPassword", e.target.value);
                form.clearErrors("confirmPassword");
              }}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-xs text-error mt-2">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
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
              "Sign Up"
            )}
          </button>
        </form>
        <div className="text-center text-sm mt-2">
          <p>
            Already a user?{" "}
            <Link href="/sign-in" className="link link-info link-hover">
              Sign in
            </Link>
          </p>
        </div>
      </fieldset>
    </div>
  );
};

export default page;
