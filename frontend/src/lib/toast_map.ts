import { toast } from "sonner";

export function mapped_toast(msg: string, type: 'success' | 'error' | 'warning' | 'info', suppress?: boolean) {
    if(suppress) {
        switch (type) {
            case "error":
                console.error(msg)
                break;
            case "success":
                console.log(msg)
                break;
            case "warning":
                console.warn(msg)
                break;
            case "info":
                console.info(msg)
                break;
            default:
                console.log(msg)
        }
    }
    else {
        switch (type) {
            case "error":
                toast.error(msg);
                console.error(msg);
                break;
            case "success":
                toast.success(msg);
                console.log(msg);
                break;
            case "warning":
                toast.warning(msg);
                console.warn(msg);
                break;
            case "info":
                toast.info(msg);
                console.info(msg);
                break;
            default:
                toast(msg);
                console.log(msg);
        }
    }
}
