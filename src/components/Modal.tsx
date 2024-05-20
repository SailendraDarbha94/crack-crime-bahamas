"use client";

import { useState } from "react";

const ModalText = ({ isVisible, onClose, children }: any) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black opacity-70"
        onClick={onClose}
      ></div>
      <div className="bg-white p-8 rounded-lg shadow-lg z-10">
        {children}
        <span
          className="mt-4 flex justify-center items-center"
          onClick={onClose}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 mx-auto hover:cursor-pointer"
            viewBox="0 0 48 48"
          >
            <defs>
              <mask id="ipSCloseOne0">
                <g fill="none" stroke-linejoin="round" stroke-width="4">
                  <path
                    fill="#fff"
                    stroke="#fff"
                    d="M24 44c11.046 0 20-8.954 20-20S35.046 4 24 4S4 12.954 4 24s8.954 20 20 20Z"
                  />
                  <path
                    stroke="#000"
                    stroke-linecap="round"
                    d="M29.657 18.343L18.343 29.657m0-11.314l11.314 11.314"
                  />
                </g>
              </mask>
            </defs>
            <path fill="black" d="M0 0h48v48H0z" mask="url(#ipSCloseOne0)" />
          </svg>
        </span>
      </div>
    </div>
  );
};

const Modal = ({
  word,
  heading,
  content,
}: {
  word: string;
  heading: string;
  content: string;
}) => {
  const [isModalVisible, setModalVisible] = useState<boolean>(false);

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);
  const lines = content.split(",");
  return (
    <>
      <span
        className="inline-block hover:cursor-pointer hover:underline"
        onClick={openModal}
      >
        {word}
      </span>
      <ModalText isVisible={isModalVisible} onClose={closeModal}>
        <h2 className="text-2xl mb-4 dark:text-black font-nunito">{heading}</h2>
        <p className="font-nunito text-lg text-wrap tracking-wide">
          {lines &&
            lines.map((line: string, index) => {
              return (
                <p key={index}>
                  {line}
                  <br />
                </p>
              );
            })}
        </p>
      </ModalText>
    </>
  );
};

export default Modal;
