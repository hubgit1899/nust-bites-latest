"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signInSchema } from "@/schemas/signinSchema";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { errorMessages } from "@/app/constants/errorMessages";

const SignInPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  //zod implementation
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    setIsSubmitting(true);
    const result = await signIn("credentials", {
      identifier: data.identifier,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      if (result.error === "CredentialsSignin") {
        toast.error("Login Failed", {
          description: "Incorrect username or password",
        });
      } else {
        console.log(result.error);
        if (
          result.error.startsWith(`Error: ${errorMessages.UNVERIFIED_ACCOUNT}`)
        ) {
          toast.error("Account not verified", {
            description: "Please verify your account before logging in.",
            action: {
              label: "Verify Now",
              onClick: () =>
                router.replace(`/verify/${result.error!.split(":")[2]}`),
            },
          });
        } else {
          toast.error("Error", {
            description: result.error,
          });
        }
      }
    }

    if (result?.url) {
      router.replace("/");
    }
    setIsSubmitting(false);
  };
  return (
    <div className="flex justify-center items-center mb-15 mt-5">
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-full max-w-md border p-6">
        <legend className="fieldset-legend text-3xl font-bold">
          Sign<span className="text-primary">In</span>
        </legend>
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-2">
          Welcome Back to nustbites
        </h1>

        <p className="text-sm">
          Please sign in to continue using our services.
        </p>

        <label className="label text-sm mt-6 font-semibold">
          Email / Username
        </label>
        <input
          type="text"
          className="input input-bordered w-full"
          placeholder="Email or Username"
          {...form.register("identifier")}
          onChange={(e) => {
            form.setValue("identifier", e.target.value);
            form.clearErrors("identifier");
          }}
        />
        {form.formState.errors.identifier && (
          <p className="text-xs text-error">
            {form.formState.errors.identifier.message}
          </p>
        )}

        <label className="label text-sm mt-2 font-semibold">Password</label>
        <input
          type="password"
          className="input input-bordered w-full"
          placeholder="Password"
          {...form.register("password")}
          onChange={(e) => {
            form.setValue("password", e.target.value);
            form.clearErrors("password");
          }}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-error ">
            {form.formState.errors.password.message}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-neutral w-full mt-6"
          disabled={isSubmitting}
          onClick={form.handleSubmit(onSubmit)}
        >
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Please wait...
            </>
          ) : (
            "Sign In"
          )}
        </button>
        <div className="text-center text-sm mt-2">
          <p>
            Not a user yet?{" "}
            <Link className="link link-info link-hover" href="/sign-up">
              Sign up
            </Link>
          </p>
        </div>
      </fieldset>
    </div>
  );
};

export default SignInPage;
