import { redirect } from "next/navigation";

export default function Home() {
  // The middleware handles redirecting to /production or /login based on auth status.
  // This is just a fallback in case middleware is bypassed in development.
  redirect("/production");
}
