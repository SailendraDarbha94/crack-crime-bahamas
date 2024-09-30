export interface ToastMessage {
  message: string;
  type: string;
}

const Toast = ({ message, type }: ToastMessage) => {
  return (
    <>
      {message && (
        <div
          className={`fixed flex justify-center items-center font-semibold z-50 text-lg top-20 right-0 w-80 min-h-14 border-2 border-black p-2 ${
            type == "success" ? "bg-green-300" : "bg-white"
          } text-black rounded-xl`}
        >
          {message}
        </div>
      )}
    </>
  );
};

export default Toast;
