import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useRouterState, Link, createRootRouteWithContext, useRouter, Outlet, HeadContent, Scripts, createFileRoute, lazyRouteComponent, redirect, createRouter } from "@tanstack/react-router";
import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useCallback, useEffect, useMemo, createContext, useContext } from "react";
import { X, Menu, MapPin, Phone, Mail } from "lucide-react";
import { m, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useTheme } from "next-themes";
import { Toaster as Toaster$1 } from "sonner";
import { g as getAuthStateFromSession, c as createSupabaseBrowserClient, s as signIn, a as signOut } from "./auth-D8LBsNTn.js";
import { i as isSupabaseConfigured } from "./env-6VBUsO0V.js";
import { z } from "zod";
const getAuthState = async () => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const {
    createSupabaseServerClient
  } = await import("./supabase.server-m-8IXvnR.js");
  const supabase = createSupabaseServerClient();
  const {
    data,
    error
  } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }
  return getAuthStateFromSession(supabase, data.session);
};
const appCss = "/assets/styles-DT5jjbfp.css";
function reportLovableError(error, context = {}) {
  if (typeof window === "undefined") return;
  window.__lovableEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error"
    }
  );
}
const motion = m;
const SITE = {
  name: "Hyderabad School",
  phones: ["+91-93906 97239", "+91-9347066804", "+91-8522000788"],
  whatsapp: "919390697239",
  email: "info@hyderabadschool.edu.in",
  address: "18-1-350/A/4, Hafez Baba Nagar X Road, Opposite Metro Function Hall, Gulshan e Iqbal Colony, Hyderabad-500005, Telangana",
  mapsUrl: "https://www.google.com/maps?q=8FJQ%2BMH8%2C%20Chandrayangutta%2C%20Hyderabad%2C%20Telangana%20500005&output=embed",
  academicYear: "2026–27"
};
const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/academics", label: "Academics" },
  { to: "/islamic-education", label: "Islamic Education" },
  { to: "/admissions", label: "Admissions" },
  { to: "/gallery", label: "Gallery" },
  { to: "/students", label: "Students" },
  { to: "/contact", label: "Contact" }
];
const OFFICE_HOURS = {
  weekdays: "8:00 AM – 4:00 PM",
  saturday: "8:00 AM – 12:00 PM",
  sunday: "Closed"
};
const HOME_STATS = [
  { value: "25+", label: "Years of Excellence" },
  { value: "1,200+", label: "Happy Students" },
  { value: "80+", label: "Expert Faculty" },
  { value: "98%", label: "Board Pass Rate" }
];
const personSlot = (role) => ({
  name: "",
  role,
  initials: "—",
  bio: ""
});
const LEADERSHIP_ROLES = [
  "Principal",
  "Vice Principal — Academics",
  "Director — Islamic Studies",
  "Director — Administration"
];
const LEADERSHIP = LEADERSHIP_ROLES.map(personSlot);
const FACULTY = [
  personSlot("Head of Mathematics"),
  personSlot("Head of Sciences"),
  personSlot("Head of English"),
  personSlot("Head of Social Sciences"),
  personSlot("Head of Arabic"),
  personSlot("Head of Computer Science"),
  personSlot("Head of Arts"),
  personSlot("Sports Director")
];
const SCHOOL_HISTORY = [
  "Founded with a vision to blend rigorous academics with Islamic character education in the heart of Hyderabad.",
  "Growing into a trusted institution serving families across Chandrayangutta and surrounding communities."
];
const logo = "/assets/logo-BpHPOc3B.png";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function Header() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return /* @__PURE__ */ jsxs("header", { className: "sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex min-w-0 items-center gap-3", children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: logo,
            alt: "Hyderabad School logo",
            className: "h-11 w-11 shrink-0",
            width: 44,
            height: 44
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 leading-tight", children: [
          /* @__PURE__ */ jsx("div", { className: "truncate font-display text-lg font-bold text-primary", children: SITE.name }),
          /* @__PURE__ */ jsx("div", { className: "hidden truncate text-[11px] uppercase tracking-widest text-muted-foreground sm:block", children: "Excellence • Iman • Akhlaq" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("nav", { className: "hidden items-center gap-1 lg:flex", children: [
        NAV_LINKS.map((l) => {
          const active = pathname === l.to;
          return /* @__PURE__ */ jsxs(
            Link,
            {
              to: l.to,
              className: cn(
                "relative rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                active ? "text-primary" : "text-foreground/75"
              ),
              children: [
                l.label,
                active && /* @__PURE__ */ jsx(
                  motion.span,
                  {
                    layoutId: "nav-underline",
                    className: "absolute inset-x-3 -bottom-0.5 h-0.5 rounded bg-primary"
                  }
                )
              ]
            },
            l.to
          );
        }),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/admissions",
            className: "ml-3 inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary-glow",
            children: "Apply Now"
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          "aria-label": "Toggle menu",
          onClick: () => setOpen((v) => !v),
          className: "inline-flex items-center justify-center rounded-md p-2 text-foreground lg:hidden",
          children: open ? /* @__PURE__ */ jsx(X, { className: "h-6 w-6" }) : /* @__PURE__ */ jsx(Menu, { className: "h-6 w-6" })
        }
      )
    ] }),
    /* @__PURE__ */ jsx(AnimatePresence, { children: open && /* @__PURE__ */ jsx(
      motion.nav,
      {
        initial: { height: 0, opacity: 0 },
        animate: { height: "auto", opacity: 1 },
        exit: { height: 0, opacity: 0 },
        className: "overflow-hidden border-t border-border/60 lg:hidden",
        children: /* @__PURE__ */ jsxs("div", { className: "space-y-1 px-4 py-4", children: [
          NAV_LINKS.map((l) => /* @__PURE__ */ jsx(
            Link,
            {
              to: l.to,
              onClick: () => setOpen(false),
              className: cn(
                "block rounded-md px-3 py-2 text-base font-medium",
                pathname === l.to ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted"
              ),
              children: l.label
            },
            l.to
          )),
          /* @__PURE__ */ jsx(
            Link,
            {
              to: "/admissions",
              onClick: () => setOpen(false),
              className: "mt-2 block rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground",
              children: "Apply Now"
            }
          )
        ] })
      }
    ) })
  ] });
}
function Footer() {
  return /* @__PURE__ */ jsxs("footer", { className: "mt-20 border-t border-border/60 bg-primary text-primary-foreground", children: [
    /* @__PURE__ */ jsxs("div", { className: "mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(
            "img",
            {
              src: logo,
              alt: "",
              className: "h-11 w-11 rounded-md bg-white/10 p-1",
              width: 44,
              height: 44
            }
          ),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "font-display text-lg font-bold", children: SITE.name }),
            /* @__PURE__ */ jsx("div", { className: "text-xs uppercase tracking-widest text-primary-foreground/70", children: "Excellence • Iman • Akhlaq" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 max-w-xs text-sm text-primary-foreground/80", children: "Nurturing the next generation with rigorous academics and timeless Islamic values." })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "font-display text-base font-semibold", children: "Explore" }),
        /* @__PURE__ */ jsx("ul", { className: "mt-4 space-y-2 text-sm", children: NAV_LINKS.map((l) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: l.to, className: "text-primary-foreground/80 transition hover:text-gold", children: l.label }) }, l.to)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "font-display text-base font-semibold", children: "Contact" }),
        /* @__PURE__ */ jsxs("ul", { className: "mt-4 space-y-3 text-sm text-primary-foreground/85", children: [
          /* @__PURE__ */ jsxs("li", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "mt-0.5 h-4 w-4 shrink-0 text-gold" }),
            " ",
            SITE.address
          ] }),
          /* @__PURE__ */ jsxs("li", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(Phone, { className: "mt-0.5 h-4 w-4 shrink-0 text-gold" }),
            /* @__PURE__ */ jsx("span", { children: SITE.phones.map((phone, index) => /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx("a", { href: `tel:${phone.replace(/\s/g, "")}`, className: "hover:text-gold", children: phone }),
              index < SITE.phones.length - 1 ? " · " : null
            ] }, phone)) })
          ] }),
          /* @__PURE__ */ jsxs("li", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(Mail, { className: "mt-0.5 h-4 w-4 shrink-0 text-gold" }),
            " ",
            SITE.email
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "font-display text-base font-semibold", children: "Office Hours" }),
        /* @__PURE__ */ jsxs("ul", { className: "mt-4 space-y-2 text-sm text-primary-foreground/85", children: [
          /* @__PURE__ */ jsxs("li", { children: [
            "Mon–Fri: ",
            OFFICE_HOURS.weekdays
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "Saturday: ",
            OFFICE_HOURS.saturday
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            "Sunday: ",
            OFFICE_HOURS.sunday
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "border-t border-white/10", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-primary-foreground/70 sm:flex-row sm:px-6 lg:px-8", children: [
      /* @__PURE__ */ jsxs("p", { children: [
        "© ",
        (/* @__PURE__ */ new Date()).getFullYear(),
        " ",
        SITE.name,
        ". All rights reserved."
      ] }),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/admin/login",
          className: "text-primary-foreground/70 transition hover:text-gold",
          children: "Staff Login"
        }
      )
    ] }) })
  ] });
}
function WhatsAppButton() {
  const url = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
    "Assalamu Alaikum, I'd like to enquire about admissions at Hyderabad School."
  )}`;
  return /* @__PURE__ */ jsx(
    motion.a,
    {
      href: url,
      target: "_blank",
      rel: "noopener noreferrer",
      "aria-label": "Chat on WhatsApp",
      initial: { scale: 0, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: { delay: 0.6, type: "spring" },
      whileHover: { scale: 1.08 },
      className: "fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-elegant",
      children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", className: "h-7 w-7", fill: "currentColor", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.821 11.821 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" }) })
    }
  );
}
const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();
  return /* @__PURE__ */ jsx(
    Toaster$1,
    {
      theme,
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
const AuthContext = createContext(null);
function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshAuth = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setAuth(null);
      setIsLoading(false);
      return;
    }
    try {
      const nextAuth = await getAuthState();
      setAuth(nextAuth);
    } catch {
      setAuth(null);
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    void refreshAuth();
    if (!isSupabaseConfigured()) {
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      void refreshAuth();
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [refreshAuth]);
  const login = useCallback(async (email, password, role) => {
    const nextAuth = await signIn(email, password, role);
    setAuth(nextAuth);
    return nextAuth;
  }, []);
  const logout = useCallback(async () => {
    await signOut();
    setAuth(null);
  }, []);
  const value = useMemo(
    () => ({
      auth,
      isLoading,
      isAuthenticated: auth !== null,
      login,
      logout
    }),
    [auth, isLoading, login, logout]
  );
  return /* @__PURE__ */ jsx(AuthContext.Provider, { value, children });
}
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
function MotionProvider({ children }) {
  return /* @__PURE__ */ jsx(LazyMotion, { features: domAnimation, strict: true, children });
}
function NotFoundComponent() {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-7xl font-bold text-gradient-primary", children: "404" }),
    /* @__PURE__ */ jsx("h2", { className: "mt-4 text-xl font-semibold", children: "Page not found" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist." }),
    /* @__PURE__ */ jsx(
      "a",
      {
        href: "/",
        className: "mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90",
        children: "Go home"
      }
    )
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold", children: "This page didn't load" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Try refreshing or head back home." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex justify-center gap-2", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsx(
        "a",
        {
          href: "/",
          className: "rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const Route$m = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Hyderabad School — Academic Excellence & Islamic Values" },
      {
        name: "description",
        content: "Hyderabad School nurtures young minds with world-class academics rooted in Islamic values. Admissions open for all classes."
      },
      { name: "author", content: "Hyderabad School" },
      { property: "og:title", content: "Hyderabad School" },
      { property: "og:description", content: "Academic Excellence rooted in Islamic Values." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" }
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
      }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$m.useRouteContext();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isPortalRoute = pathname.startsWith("/admin") || pathname.startsWith("/faculty");
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxs(AuthProvider, { children: [
    isPortalRoute ? /* @__PURE__ */ jsx(Outlet, {}) : /* @__PURE__ */ jsx(MotionProvider, { children: /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col", children: [
      /* @__PURE__ */ jsx(Header, {}),
      /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsx(Outlet, {}) }),
      /* @__PURE__ */ jsx(Footer, {}),
      /* @__PURE__ */ jsx(WhatsAppButton, {})
    ] }) }),
    /* @__PURE__ */ jsx(Toaster, { richColors: true, position: "top-center" })
  ] }) });
}
const $$splitComponentImporter$k = () => import("./students-UBiJfBYA.js");
const Route$l = createFileRoute("/students")({
  head: () => ({
    meta: [{
      title: "Students — Hyderabad School"
    }, {
      name: "description",
      content: "Download class materials — worksheets, notes and study resources for Classes 1–10."
    }, {
      property: "og:title",
      content: "Student Resources — Hyderabad School"
    }, {
      property: "og:description",
      content: "Browse and download learning materials by class. Public read-only access."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$k, "component")
});
const $$splitComponentImporter$j = () => import("./islamic-education-D29oqdxN.js");
const Route$k = createFileRoute("/islamic-education")({
  head: () => ({
    meta: [{
      title: "Islamic Education — Hyderabad School"
    }, {
      name: "description",
      content: "Quran, Salah, Akhlaq and Ilm — a complete Islamic curriculum alongside modern academics at Hyderabad School."
    }, {
      property: "og:title",
      content: "Islamic Education at Hyderabad School"
    }, {
      property: "og:description",
      content: "Daily duas, character building and faith in practice for every student."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$j, "component")
});
const $$splitComponentImporter$i = () => import("./gallery-DZNhG4HL.js");
const Route$j = createFileRoute("/gallery")({
  head: () => ({
    meta: [{
      title: "Gallery — Hyderabad School"
    }, {
      name: "description",
      content: "Glimpses from campus — classrooms, library, labs, prayer hall, sports and celebrations."
    }, {
      property: "og:title",
      content: "Gallery — Hyderabad School"
    }, {
      property: "og:description",
      content: "A visual tour of our campus and student life."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$i, "component")
});
const $$splitComponentImporter$h = () => import("./contact-BsO7gO89.js");
const Route$i = createFileRoute("/contact")({
  head: () => ({
    meta: [{
      title: "Contact — Hyderabad School"
    }, {
      name: "description",
      content: "Get in touch with Hyderabad School. Address, phone, email and contact form."
    }, {
      property: "og:title",
      content: "Contact Hyderabad School"
    }, {
      property: "og:description",
      content: "We'd love to hear from you."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$h, "component")
});
z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(5, "Please share a bit more").max(1e3)
});
const $$splitComponentImporter$g = () => import("./admissions-K291GcAh.js");
const Route$h = createFileRoute("/admissions")({
  head: () => ({
    meta: [{
      title: "Admissions — Hyderabad School"
    }, {
      name: "description",
      content: "Apply to Hyderabad School for the new academic year. Submit an admission enquiry online."
    }, {
      property: "og:title",
      content: "Admissions — Hyderabad School"
    }, {
      property: "og:description",
      content: "Process, requirements and admission enquiry form."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$g, "component")
});
z.object({
  parentName: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone").max(20).regex(/^[0-9+\-\s()]+$/, "Digits, spaces and + only"),
  studentName: z.string().trim().min(2, "Enter the student's name").max(100),
  grade: z.string().min(1, "Please select a class"),
  message: z.string().trim().max(1e3).optional()
});
const $$splitComponentImporter$f = () => import("./academics-CwAmi2rQ.js");
const Route$g = createFileRoute("/academics")({
  head: () => ({
    meta: [{
      title: "Academics — Hyderabad School"
    }, {
      name: "description",
      content: "Explore our SSC-aligned curriculum from pre-primary to senior secondary, plus faculty showcase."
    }, {
      property: "og:title",
      content: "Academics at Hyderabad School"
    }, {
      property: "og:description",
      content: "Curriculum, programs and faculty shaping tomorrow's leaders."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$f, "component")
});
const $$splitComponentImporter$e = () => import("./about-2VOmHVO3.js");
const Route$f = createFileRoute("/about")({
  head: () => ({
    meta: [{
      title: "About — Hyderabad School"
    }, {
      name: "description",
      content: "Discover the vision, mission and leadership of Hyderabad School — where academic excellence meets Islamic values."
    }, {
      property: "og:title",
      content: "About Hyderabad School"
    }, {
      property: "og:description",
      content: "Our vision, mission and the leaders shaping our community."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$e, "component")
});
async function requireRole(role) {
  const auth = await getAuthState();
  if (!auth) {
    throw redirect({ to: "/admin/login" });
  }
  if (auth.role !== role) {
    throw redirect({ to: auth.role === "admin" ? "/admin/dashboard" : "/faculty/portal/profile" });
  }
  return auth;
}
async function requireAdmin() {
  return requireRole("admin");
}
async function redirectIfAuthenticated() {
  const auth = await getAuthState();
  if (!auth) {
    return null;
  }
  throw redirect({
    to: auth.role === "admin" ? "/admin/dashboard" : "/faculty/portal/profile"
  });
}
const assertFacultyCanAccessPortal = async (userId) => {
  if (!isSupabaseConfigured()) {
    return;
  }
  const {
    createSupabaseServerClient
  } = await import("./supabase.server-m-8IXvnR.js");
  const {
    assertFacultyPortalAccess
  } = await import("./faculty-portal-DwDCZHH7.js");
  await assertFacultyPortalAccess(createSupabaseServerClient(), userId);
};
async function requireFaculty() {
  const auth = await requireRole("faculty");
  await assertFacultyCanAccessPortal(auth.userId);
  return auth;
}
const $$splitComponentImporter$d = () => import("./route-qk7CRHUv.js");
const Route$e = createFileRoute("/faculty")({
  beforeLoad: async () => {
    await requireFaculty();
  },
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./route-IcTWwidy.js");
const Route$d = createFileRoute("/admin")({
  beforeLoad: async ({
    location
  }) => {
    if (location.pathname === "/admin/login") {
      return;
    }
    await requireAdmin();
  },
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./index-BKyvNPfg.js");
const Route$c = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "Hyderabad School — Academic Excellence & Islamic Values"
    }, {
      name: "description",
      content: "Hyderabad School blends rigorous academics with timeless Islamic values. Discover our programs, faculty and admissions."
    }, {
      property: "og:title",
      content: "Hyderabad School"
    }, {
      property: "og:description",
      content: "Academic Excellence rooted in Islamic Values."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./settings-C7A5NoPK.js");
const Route$b = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [{
      title: "Settings — Admin — Hyderabad School"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./login-ClZe2yum.js");
const Route$a = createFileRoute("/admin/login")({
  beforeLoad: async () => {
    await redirectIfAuthenticated();
  },
  head: () => ({
    meta: [{
      title: "Staff Login — Hyderabad School"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./gallery-B57YCGtQ.js");
const Route$9 = createFileRoute("/admin/gallery")({
  head: () => ({
    meta: [{
      title: "Gallery — Admin — Hyderabad School"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./faculty-accounts-7xgUdpY2.js");
const Route$8 = createFileRoute("/admin/faculty-accounts")({
  head: () => ({
    meta: [{
      title: "Faculty Accounts — Admin — Hyderabad School"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./faculty-BS0qzIF9.js");
const Route$7 = createFileRoute("/admin/faculty")({
  head: () => ({
    meta: [{
      title: "Faculty — Admin — Hyderabad School"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./dashboard-B4AAHxlk.js");
const Route$6 = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [{
      title: "Admin Dashboard — Hyderabad School"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./class-materials-BxdPnpWV.js");
const Route$5 = createFileRoute("/admin/class-materials")({
  head: () => ({
    meta: [{
      title: "Class Materials — Admin — Hyderabad School"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./admissions-2m8eTrbd.js");
const Route$4 = createFileRoute("/admin/admissions")({
  head: () => ({
    meta: [{
      title: "Admissions — Admin — Hyderabad School"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./route-BWxilEGm.js");
const Route$3 = createFileRoute("/faculty/portal")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const Route$2 = createFileRoute("/faculty/portal/")({
  beforeLoad: () => {
    throw redirect({ to: "/faculty/portal/profile" });
  }
});
const $$splitComponentImporter$1 = () => import("./profile-7LeopvNb.js");
const Route$1 = createFileRoute("/faculty/portal/profile")({
  head: () => ({
    meta: [{
      title: "My Profile — Faculty — Hyderabad School"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./materials-C1AlfOFe.js");
const Route = createFileRoute("/faculty/portal/materials")({
  head: () => ({
    meta: [{
      title: "Class Materials — Faculty — Hyderabad School"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const StudentsRoute = Route$l.update({
  id: "/students",
  path: "/students",
  getParentRoute: () => Route$m
});
const IslamicEducationRoute = Route$k.update({
  id: "/islamic-education",
  path: "/islamic-education",
  getParentRoute: () => Route$m
});
const GalleryRoute = Route$j.update({
  id: "/gallery",
  path: "/gallery",
  getParentRoute: () => Route$m
});
const ContactRoute = Route$i.update({
  id: "/contact",
  path: "/contact",
  getParentRoute: () => Route$m
});
const AdmissionsRoute = Route$h.update({
  id: "/admissions",
  path: "/admissions",
  getParentRoute: () => Route$m
});
const AcademicsRoute = Route$g.update({
  id: "/academics",
  path: "/academics",
  getParentRoute: () => Route$m
});
const AboutRoute = Route$f.update({
  id: "/about",
  path: "/about",
  getParentRoute: () => Route$m
});
const FacultyRouteRoute = Route$e.update({
  id: "/faculty",
  path: "/faculty",
  getParentRoute: () => Route$m
});
const AdminRouteRoute = Route$d.update({
  id: "/admin",
  path: "/admin",
  getParentRoute: () => Route$m
});
const IndexRoute = Route$c.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$m
});
const AdminSettingsRoute = Route$b.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => AdminRouteRoute
});
const AdminLoginRoute = Route$a.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => AdminRouteRoute
});
const AdminGalleryRoute = Route$9.update({
  id: "/gallery",
  path: "/gallery",
  getParentRoute: () => AdminRouteRoute
});
const AdminFacultyAccountsRoute = Route$8.update({
  id: "/faculty-accounts",
  path: "/faculty-accounts",
  getParentRoute: () => AdminRouteRoute
});
const AdminFacultyRoute = Route$7.update({
  id: "/faculty",
  path: "/faculty",
  getParentRoute: () => AdminRouteRoute
});
const AdminDashboardRoute = Route$6.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => AdminRouteRoute
});
const AdminClassMaterialsRoute = Route$5.update({
  id: "/class-materials",
  path: "/class-materials",
  getParentRoute: () => AdminRouteRoute
});
const AdminAdmissionsRoute = Route$4.update({
  id: "/admissions",
  path: "/admissions",
  getParentRoute: () => AdminRouteRoute
});
const FacultyPortalRouteRoute = Route$3.update({
  id: "/portal",
  path: "/portal",
  getParentRoute: () => FacultyRouteRoute
});
const FacultyPortalIndexRoute = Route$2.update({
  id: "/",
  path: "/",
  getParentRoute: () => FacultyPortalRouteRoute
});
const FacultyPortalProfileRoute = Route$1.update({
  id: "/profile",
  path: "/profile",
  getParentRoute: () => FacultyPortalRouteRoute
});
const FacultyPortalMaterialsRoute = Route.update({
  id: "/materials",
  path: "/materials",
  getParentRoute: () => FacultyPortalRouteRoute
});
const AdminRouteRouteChildren = {
  AdminAdmissionsRoute,
  AdminClassMaterialsRoute,
  AdminDashboardRoute,
  AdminFacultyRoute,
  AdminFacultyAccountsRoute,
  AdminGalleryRoute,
  AdminLoginRoute,
  AdminSettingsRoute
};
const AdminRouteRouteWithChildren = AdminRouteRoute._addFileChildren(
  AdminRouteRouteChildren
);
const FacultyPortalRouteRouteChildren = {
  FacultyPortalMaterialsRoute,
  FacultyPortalProfileRoute,
  FacultyPortalIndexRoute
};
const FacultyPortalRouteRouteWithChildren = FacultyPortalRouteRoute._addFileChildren(FacultyPortalRouteRouteChildren);
const FacultyRouteRouteChildren = {
  FacultyPortalRouteRoute: FacultyPortalRouteRouteWithChildren
};
const FacultyRouteRouteWithChildren = FacultyRouteRoute._addFileChildren(
  FacultyRouteRouteChildren
);
const rootRouteChildren = {
  IndexRoute,
  AdminRouteRoute: AdminRouteRouteWithChildren,
  FacultyRouteRoute: FacultyRouteRouteWithChildren,
  AboutRoute,
  AcademicsRoute,
  AdmissionsRoute,
  ContactRoute,
  GalleryRoute,
  IslamicEducationRoute,
  StudentsRoute
};
const routeTree = Route$m._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  FACULTY as F,
  HOME_STATS as H,
  LEADERSHIP as L,
  SITE as S,
  SCHOOL_HISTORY as a,
  LEADERSHIP_ROLES as b,
  cn as c,
  motion as m,
  router as r,
  useAuth as u
};
