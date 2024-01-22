//@ts-nocheck
"use client";
import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User,
  Chip,
  Tooltip,
  getKeyValue,
} from "@nextui-org/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
  Input,
} from "@nextui-org/react";
import { EditIcon } from "./EditIcon";
import { DeleteIcon } from "./DeleteIcon";
import { EyeIcon } from "./EyeIcon";
import { columns, users } from "./data";

const statusColorMap = {
  active: "success",
  paused: "danger",
  vacation: "warning",
};

export default function JobsList() {
  const renderCell = React.useCallback((user, columnKey) => {
    const cellValue = user[columnKey];

    switch (columnKey) {
      case "name":
        return (
          <User
            avatarProps={{ radius: "lg", src: user.avatar }}
            description={user.email}
            name={cellValue}
          >
            {user.email}
          </User>
        );
      case "role":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize">{cellValue}</p>
            <p className="text-bold text-sm capitalize text-default-400">
              {user.team}
            </p>
          </div>
        );
      case "status":
        return (
          <Chip
            className="capitalize"
            color={statusColorMap[user.status]}
            size="sm"
            variant="flat"
          >
            {cellValue}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content="Details">
              <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                <EyeIcon />
              </span>
            </Tooltip>
            <Tooltip content="Apply For Job">
              <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                <Button onPress={onOpen} color="primary" variant="shadow">
                  <EditIcon />
                </Button>
              </span>
            </Tooltip>
            {/* <Tooltip color="danger" content="Delete user">
              <span className="text-lg text-danger cursor-pointer active:opacity-50">
                <DeleteIcon />
              </span>
            </Tooltip> */}
          </div>
        );
      default:
        return cellValue;
    }
  }, []);
  const { isOpen: openModal, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: newOpenModal,
    onOpen: newOnOpen,
    onOpenChange: newOpenChange,
  } = useDisclosure();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  async function handleSubmit() {
    console.log("clicked");
  }
  return (
    <div>
      <Modal isOpen={newOpenModal} onOpenChange={newOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col items-center gap-1">
                Apply to Job Form 2
              </ModalHeader>
              <ModalBody>
                <div className="mx-auto">
                  <Input
                    className="w-80 my-2"
                    name="email"
                    value={email}
                    type="email"
                    label="Email"
                    placeholder=""
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    className="w-80 my-2"
                    name="password"
                    value={password}
                    type="password"
                    label="Password"
                    placeholder=""
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="primary"
                  onPress={onClose}
                  onClick={handleSubmit}
                  variant="flat"
                  className="mx-auto"
                >
                  Submit
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <Modal isOpen={openModal} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col items-center gap-1">
                Apply to Job Form
              </ModalHeader>
              <ModalBody>
                <div className="mx-auto">
                  <Input
                    className="w-80 my-2"
                    name="email"
                    value={email}
                    type="email"
                    label="Email"
                    placeholder=""
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    className="w-80 my-2"
                    name="password"
                    value={password}
                    type="password"
                    label="Password"
                    placeholder=""
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="primary"
                  onPress={onClose}
                  onClick={handleSubmit}
                  variant="flat"
                  className="mx-auto"
                >
                  Submit
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <p>
        try click
        <Button onPress={newOnOpen} color="primary" variant="shadow">
          Modal
        </Button>
      </p>

      <Table aria-label="Example table with custom cells">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === "actions" ? "center" : "start"}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={users}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
