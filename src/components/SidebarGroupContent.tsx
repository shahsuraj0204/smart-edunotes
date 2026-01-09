"use client";

import { Note } from "@prisma/client";

import {
  SidebarGroupContent as SidebarGroupContentShadCN,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { Input } from "./ui/input";
import { useEffect, useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
import Fuse from "fuse.js";
import SelectNoteButton from "./SelectNoteButton";
import DeleteNoteButton from "./DeleteNoteButton";

type Props = {
    notes: Note[];
}
function SidebarGroupContent({notes} : Props) {

  const [searchText, setSearchText] = useState("");
  const [localNotes, setLocalNotes] = useState(notes);

  useEffect(() =>{
    setLocalNotes(notes);
  }, [notes]);

  const fuse = useMemo(() => {
    return new Fuse(localNotes, {
      keys: ["text"], 
      threshold: 0.4,
    });
  }, [localNotes])

  const filterNotes = searchText ? fuse.search(searchText).map((result) => result.item) : localNotes;


  const deleteNoteLocally = (noteId: string) => {
    setLocalNotes((prevNotes) =>
      prevNotes.filter((note) => note.id !== noteId),
    );
  };


  return (
    <SidebarGroupContentShadCN>
      <div className="relative flex items-center">
        <SearchIcon className="absolute left-4 size-4"/>
        <Input placeholder="Search" className="pl-10" value={searchText} onChange={(e) => setSearchText(e.target.value)}/>
      </div>

      <SidebarMenu className="mt-4">
        {filterNotes.map((note) => (
          // key={note.id} add kiya hai 
          <SidebarMenuItem key={note.id} className="cursor-pointer hover:bg-muted  p-2 group/item border-2 shadow-2xl w-full h-25">
            {/* {note.text} */}
            <SelectNoteButton note={note}/>

            <DeleteNoteButton
              noteId={note.id}
              deleteNoteLocally = {deleteNoteLocally}
            />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroupContentShadCN>
  )
}

export default SidebarGroupContent
