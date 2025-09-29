// src/hooks/useToast.js
import { useState } from "react";

export default function useToast() {
  const [toast, setToast] = useState({
    show: false,
    message: "",
    bg: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, bg: type });
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  return { toast, showToast, hideToast };
}
