import { motion } from "@/lib/motion";
import { CLASS_NUMBERS, type ClassNumber } from "@/lib/class-materials";
import { cn } from "@/lib/utils";

type ClassSelectorProps = {
  selected: ClassNumber | null;
  onSelect: (classNumber: ClassNumber) => void;
};

export function ClassSelector({ selected, onSelect }: ClassSelectorProps) {
  return (
    <div
      role="tablist"
      aria-label="Select class"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:gap-4"
    >
      {CLASS_NUMBERS.map((classNumber, index) => {
        const isSelected = selected === classNumber;

        return (
          <motion.button
            key={classNumber}
            type="button"
            role="tab"
            aria-selected={isSelected}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: index * 0.04 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(classNumber)}
            className={cn(
              "rounded-2xl border px-4 py-5 text-center shadow-soft transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isSelected
                ? "border-primary bg-primary text-primary-foreground shadow-elegant"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5",
            )}
          >
            <span className="block font-display text-lg font-bold sm:text-xl">
              Class {classNumber}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
