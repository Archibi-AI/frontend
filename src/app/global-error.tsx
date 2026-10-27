"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", textAlign: "center", padding: "4rem 1rem" }}>
        <p>someThing went wrong! please try again later or share your problem with us</p>
        <button type="button" onClick={reset}>Try again</button>
      </body>
    </html>
  );
}
