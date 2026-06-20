import { motion } from "@/lib/motion";

export interface Person {
  name: string;
  role: string;
  bio?: string;
  initials: string;
  accent?: string; // tailwind color class for avatar bg
  photoUrl?: string;
}

export function PersonCard({ person, index = 0 }: { person: Person; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      whileHover={{ y: -6 }}
      className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:shadow-elegant"
    >
      <div
        className={`mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-full font-display text-2xl font-bold text-primary-foreground ${person.photoUrl ? "" : (person.accent ?? "bg-gradient-to-br from-primary to-primary-glow")}`}
      >
        {person.photoUrl ? (
          <img src={person.photoUrl} alt={person.name} className="h-full w-full object-cover" />
        ) : (
          person.initials
        )}
      </div>
      <h3 className="mt-5 text-center font-display text-xl font-semibold">{person.name}</h3>
      <p className="text-center text-sm font-medium text-primary">{person.role}</p>
      {person.bio && <p className="mt-3 text-center text-sm text-muted-foreground">{person.bio}</p>}
    </motion.div>
  );
}
