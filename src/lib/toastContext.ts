import { createContext } from "react";

const ToastContext = createContext({
    toast: (params: string) => Promise.resolve()
});

export default ToastContext
