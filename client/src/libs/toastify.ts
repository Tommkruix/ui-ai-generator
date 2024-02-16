import toast from 'react-hot-toast';


export const showToast = (message: string, status: string) => {
    if (status == "success") {
        toast.success(message)
    }
    else if (status == "error") {
        toast.error(message)
    }
    else{
        toast(message)
    }
}