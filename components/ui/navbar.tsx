"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const AIRMAIL_SWATCH = `repeating-linear-gradient(
  -45deg,
  var(--postal-red)   0px  4px,
  var(--postal-paper) 4px  6px,
  var(--postal-blue)  6px 10px,
  var(--postal-paper) 10px 12px
)`;

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const navLinks = [
    { href: "/settings", label: "Settings", title: "API Settings" },
    { href: "/#why-it-matters", label: "Why It Matters" },
    {
      href: "https://github.com/postcardhq/postcard",
      label: "GitHub",
      isExternal: true,
    },
  ];

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 w-full"
      style={{
        background: "var(--postal-paper)",
        borderBottom: "1px solid var(--postal-ink-muted)",
      }}
    >
      <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          onClick={closeMenu}
          className="inline-flex items-center gap-3 min-h-[44px]"
          style={{ textDecoration: "none" }}
        >
          <div
            className="w-5 h-5 shrink-0"
            style={{ backgroundImage: AIRMAIL_SWATCH }}
            aria-hidden="true"
          />
          <span
            className="text-sm tracking-[0.28em] uppercase font-semibold"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--postal-ink)",
            }}
          >
            Postcard
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              target={link.isExternal ? "_blank" : undefined}
              rel={link.isExternal ? "noopener noreferrer" : undefined}
              className="inline-flex items-center min-h-[44px] px-3 text-[11px] tracking-[0.22em] uppercase transition-colors"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--postal-ink-muted)",
              }}
              title={link.title}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Hamburger Button */}
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 -mr-2"
          onClick={toggleMenu}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          style={{ color: "var(--postal-ink)" }}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              transformOrigin: "top",
              background: "var(--postal-paper)",
              borderBottom: "1px solid var(--postal-ink-muted)",
            }}
            className="md:hidden absolute top-full left-0 w-full overflow-hidden shadow-sm"
          >
            <div className="flex flex-col px-6 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  target={link.isExternal ? "_blank" : undefined}
                  rel={link.isExternal ? "noopener noreferrer" : undefined}
                  onClick={closeMenu}
                  className="flex items-center h-12 text-sm tracking-[0.15em] uppercase font-medium border-b border-[var(--postal-ink-faint)] last:border-0"
                  style={{
                    fontFamily: "var(--font-serif)",
                    color: "var(--postal-ink)",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
