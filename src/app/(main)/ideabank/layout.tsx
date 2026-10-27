import type { ReactNode } from "react";

/** `modal` is the intercepted post popup (@modal/(.)post/[uuid]); it renders over whichever feed page is open. */
export default function IdeaBankLayout({ children, modal }: { children: ReactNode; modal: ReactNode }) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
