import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { searchPrincipalDirectory, type SearchHit } from "@/services/principal-command";

export function PrincipalSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(term), 250);
    return () => window.clearTimeout(timer);
  }, [term]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { data: hits = [] } = useQuery({
    queryKey: ["admin", "principal-search", debounced],
    queryFn: () => searchPrincipalDirectory(debounced),
    enabled: open && debounced.trim().length >= 2,
  });

  const grouped = {
    student: hits.filter((hit) => hit.kind === "student"),
    parent: hits.filter((hit) => hit.kind === "parent"),
    staff: hits.filter((hit) => hit.kind === "staff"),
  };

  const go = (hit: SearchHit) => {
    setOpen(false);
    void navigate({ to: hit.href });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground shadow-sm hover:bg-muted/40"
      >
        <Search className="size-4" />
        Search student, parent, staff
        <kbd className="ml-2 hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline">
          Ctrl K
        </kbd>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
          <DialogTitle className="sr-only">Search school directory</DialogTitle>
          <Command shouldFilter={false} className="rounded-lg">
            <CommandInput
              placeholder="Student name, HS-YYYY-NNNNN, parent, or staff…"
              value={term}
              onValueChange={setTerm}
            />
            <CommandList>
              <CommandEmpty>
                {debounced.trim().length < 2 ? "Type at least 2 characters." : "No matching people."}
              </CommandEmpty>
              {grouped.student.length > 0 ? (
                <CommandGroup heading="Students">
                  {grouped.student.map((hit) => (
                    <CommandItem
                      key={hit.id}
                      value={`${hit.title} ${hit.subtitle}`}
                      onSelect={() => go(hit)}
                    >
                      <span className="font-medium">{hit.title}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{hit.subtitle}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
              {grouped.parent.length > 0 ? (
                <CommandGroup heading="Parents">
                  {grouped.parent.map((hit) => (
                    <CommandItem
                      key={hit.id}
                      value={`${hit.title} ${hit.subtitle}`}
                      onSelect={() => go(hit)}
                    >
                      <span className="font-medium">{hit.title}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{hit.subtitle}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
              {grouped.staff.length > 0 ? (
                <CommandGroup heading="Staff">
                  {grouped.staff.map((hit) => (
                    <CommandItem
                      key={hit.id}
                      value={`${hit.title} ${hit.subtitle}`}
                      onSelect={() => go(hit)}
                    >
                      <span className="font-medium">{hit.title}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{hit.subtitle}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
