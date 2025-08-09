
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Brush,
  Home,
  Edit,
  Plus,
  Copy,
  Image,
  Download,
  Printer,
  Trash2,
  Accessibility,
} from "lucide-react";
import { useDocuments } from "../contexts/DocumentContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import StylePanel from "./StylePanel";
import AccessibilityPanel from "./AccessibilityPanel";

interface EditorSidebarProps {
  document: any;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({ document }) => {
  const navigate = useNavigate();
  const {
    createDocument,
    updateDocument,
    duplicateDocument,
    exportDocument,
    deleteDocument,
  } = useDocuments();

  // --- RENAME DIALOG STATE
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const openRenameDialog = () => {
    if (!document) return;
    setNewTitle(document.title);
    setRenameDialogOpen(true);
  };

  const handleRename = () => {
    if (!document) return;
    setNewTitle(document.title);
    setRenameDialogOpen(true);
  };

  const submitRename = () => {
    if (document && newTitle.trim() && newTitle !== document.title) {
      updateDocument(document.id, { title: newTitle.trim() });
    }
    setRenameDialogOpen(false);
  };

  const handleNew = () => {
    const newDoc = createDocument();
    navigate(`/editor/${newDoc.id}`);
  };

  const handleDuplicate = () => {
    if (!document) return;
    const newDoc = duplicateDocument(document.id);
    if (newDoc) {
      navigate(`/editor/${newDoc.id}`);
    }
  };

  const handleDelete = () => {
    if (!document) return;
    if (window.confirm("Are you sure you want to delete this document?")) {
      deleteDocument(document.id);
      navigate("/");
    }
  };

  return (
    <>
      {/* Floating Icons */}
      <div className="fixed top-8 left-6 z-50 flex flex-col items-center pointer-events-auto space-y-4">
        {/* Menu button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="relative group">
              <button
                className={`w-12 h-12 bg-white shadow-xl rounded-full flex items-center justify-center border-2 border-gray-200 hover:shadow-2xl transition group relative outline-none`}
                aria-label="Menu"
                tabIndex={0}
                type="button"
              >
                <Menu className="w-6 h-6 text-gray-900 group-hover:text-black" />
                <span className="absolute top-[105%] left-1/2 -translate-x-1/2 text-xs bg-white shadow px-2 py-1 rounded mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition z-50 border border-gray-100">
                  Menu
                </span>
              </button>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 ml-5" side="right" align="start">
            <DropdownMenuLabel>Document</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/")}>
              <Home className="mr-2 h-4 w-4" />
              <span>Home</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openRenameDialog}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Rename</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" />
              <span>New</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              <span>Duplicate</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Export</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => document && exportDocument(document.id, "image")}
            >
              <Image className="mr-2 h-4 w-4" />
              <span>Save as Image</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => document && exportDocument(document.id, "text")}
            >
              <Download className="mr-2 h-4 w-4" />
              <span>Export as Text</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => document && exportDocument(document.id, "html")}
            >
              <Download className="mr-2 h-4 w-4" />
              <span>Export HTML</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-red-600">
              Danger Zone
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Style Panel Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="relative group">
              <button
                className={`w-12 h-12 bg-white shadow-xl rounded-full flex items-center justify-center border-2 border-gray-200 hover:shadow-2xl transition group relative outline-none`}
                aria-label="Style"
                tabIndex={0}
                type="button"
              >
                <Brush className="w-6 h-6 text-gray-900 group-hover:text-black" />
                <span className="absolute top-[105%] left-1/2 -translate-x-1/2 text-xs bg-white shadow px-2 py-1 rounded mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition z-50 border border-gray-100">
                  Style
                </span>
              </button>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 ml-5 p-0 border-gray-200" side="right" align="start">
            <StylePanel document={document} />
          </PopoverContent>
        </Popover>

        {/* Accessibility Panel Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="relative group">
              <button
                className={`w-12 h-12 bg-white shadow-xl rounded-full flex items-center justify-center border-2 border-gray-200 hover:shadow-2xl transition group relative outline-none`}
                aria-label="Accessibility"
                tabIndex={0}
                type="button"
              >
                <Accessibility className="w-6 h-6 text-gray-900 group-hover:text-black" />
                <span className="absolute top-[105%] left-1/2 -translate-x-1/2 text-xs bg-white shadow px-2 py-1 rounded mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition z-50 border border-gray-100">
                  Accessibility
                </span>
              </button>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 ml-5 p-0 border-gray-200" side="right" align="start">
            <AccessibilityPanel document={document} />
          </PopoverContent>
        </Popover>
      </div>

      {/* RENAME MODAL */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
            <DialogDescription>
              Enter a new title for your document.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="mt-2"
            spellCheck={false}
            onKeyDown={e => {
              if (e.key === "Enter") submitRename();
              if (e.key === "Escape") setRenameDialogOpen(false);
            }}
          />
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setRenameDialogOpen(false)}
            >Cancel</Button>
            <Button
              type="button"
              onClick={submitRename}
              disabled={!newTitle.trim() || newTitle === document?.title}
            >Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditorSidebar;

