import type { Person } from "@/components/site/PersonCard";

export const SITE = {
  name: "Hyderabad School",
  tagline: "Private educational institution rooted in academic excellence and Islamic values",
  phone: "+91-93906 97239",
  phones: ["+91-93906 97239", "+91-9347066804", "+91-8522000788"] as const,
  whatsapp: "919390697239",
  email: "info@hyderabadschool.edu.in",
  address:
    "18-1-350/A/4, Hafez Baba Nagar X Road, Opposite Metro Function Hall, Gulshan e Iqbal Colony, Hyderabad-500005, Telangana",
  mapsQuery: "8FJQ+MH8, Chandrayangutta, Hyderabad, Telangana 500005",
  mapsUrl:
    "https://www.google.com/maps?q=8FJQ%2BMH8%2C%20Chandrayangutta%2C%20Hyderabad%2C%20Telangana%20500005&output=embed",
  academicYear: "2026–27",
} as const;

export const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/academics", label: "Academics" },
  { to: "/islamic-education", label: "Islamic Education" },
  { to: "/admissions", label: "Admissions" },
  { to: "/gallery", label: "Gallery" },
  { to: "/students", label: "Students" },
  { to: "/contact", label: "Contact" },
] as const;

export const OFFICE_HOURS = {
  weekdays: "8:00 AM – 4:00 PM",
  saturday: "8:00 AM – 12:00 PM",
  sunday: "Closed",
} as const;

export const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://www.facebook.com/" },
  { label: "Instagram", href: "https://www.instagram.com/" },
] as const;

export const HOME_STATS = [
  { value: "25+", label: "Years of Excellence" },
  { value: "1,200+", label: "Happy Students" },
  { value: "80+", label: "Expert Faculty" },
  { value: "98%", label: "Board Pass Rate" },
] as const;

const personSlot = (role: string): Person => ({
  name: "",
  role,
  initials: "—",
  bio: "",
});

export const LEADERSHIP_ROLES = [
  "Principal",
  "Vice Principal — Academics",
  "Director — Islamic Studies",
  "Director — Administration",
] as const;

export const LEADERSHIP: Person[] = LEADERSHIP_ROLES.map(personSlot);

export const FACULTY: Person[] = [
  personSlot("Head of Mathematics"),
  personSlot("Head of Sciences"),
  personSlot("Head of English"),
  personSlot("Head of Social Sciences"),
  personSlot("Head of Arabic"),
  personSlot("Head of Computer Science"),
  personSlot("Head of Arts"),
  personSlot("Sports Director"),
];

export const SCHOOL_HISTORY = [
  "Founded with a vision to blend rigorous academics with Islamic character education in the heart of Hyderabad.",
  "Growing into a trusted institution serving families across Chandrayangutta and surrounding communities.",
] as const;
