"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Main() {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();

    if (!trimmed) {
      setError("Please enter a YouTube channel URL or handle.");
      return;
    }

    setError("");
    router.push(`/channel?url=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="flex flex-col items-center justify-center m-5">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Enter YouTube channel URL or @handle"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="border px-4 py-2 rounded-lg outline-none w-[360px]"
        />
        <button type="submit" className="px-4 py-2 rounded-lg border">
          Get Channel Data
        </button>
      </form>
      {error ? <p className="text-red-600 mt-3">{error}</p> : null}
    </div>
  );
}
