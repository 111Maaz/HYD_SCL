import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/logo.png";
import { NAV_LINKS, OFFICE_HOURS, SITE, SOCIAL_LINKS } from "@/lib/site";

const SOCIAL_ICONS = {
  Facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  Instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
} as const;

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border/60 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt=""
              className="h-11 w-11 rounded-md bg-white/10 p-1"
              width={44}
              height={44}
            />
            <div>
              <div className="font-display text-lg font-bold">{SITE.name}</div>
              <div className="text-xs uppercase tracking-widest text-primary-foreground/70">
                Excellence • Iman • Akhlaq
              </div>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm text-primary-foreground/80">
            Nurturing the next generation with rigorous academics and timeless Islamic values.
          </p>
          {/* Social icons disabled
          <div className="mt-5 flex gap-3">
            {SOCIAL_LINKS.filter((social) => social.href).map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition hover:bg-gold hover:text-gold-foreground"
              >
                {SOCIAL_ICONS[social.label as keyof typeof SOCIAL_ICONS]}
              </a>
            ))}
          </div>
          */}
        </div>

        <div>
          <h3 className="font-display text-base font-semibold">Explore</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {NAV_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-primary-foreground/80 transition hover:text-gold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-base font-semibold">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/85">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {SITE.address}
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <span>
                {SITE.phones.map((phone, index) => (
                  <span key={phone}>
                    <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-gold">
                      {phone}
                    </a>
                    {index < SITE.phones.length - 1 ? " · " : null}
                  </span>
                ))}
              </span>
            </li>
            <li className="flex gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {SITE.email}
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-base font-semibold">Office Hours</h3>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/85">
            <li>Mon–Fri: {OFFICE_HOURS.weekdays}</li>
            <li>Saturday: {OFFICE_HOURS.saturday}</li>
            <li>Sunday: {OFFICE_HOURS.sunday}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-primary-foreground/70 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <Link
            to="/admin/login"
            className="text-primary-foreground/70 transition hover:text-gold"
          >
            Staff Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
