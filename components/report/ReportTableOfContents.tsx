'use client';

import React, { useState, useEffect } from 'react';
import { ListOrdered, ChevronRight, Bookmark } from 'lucide-react';

export interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface ReportTableOfContentsProps {
  content: string;
  customSections?: Array<{ id: string; title: string }>;
}

export function ReportTableOfContents({
  content,
  customSections,
}: ReportTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [tocItems, setTocItems] = useState<TocItem[]>([]);

  // Parse headings from markdown
  useEffect(() => {
    const lines = content.split('\n');
    const items: TocItem[] = [];

    lines.forEach((line) => {
      const h2Match = line.match(/^##\s+(.+)$/);
      if (h2Match) {
        const title = h2Match[1].replace(/[*_`]/g, '').trim();
        const id = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        items.push({ id, title, level: 2 });
      }
    });

    // If standard parsed headings are sparse, provide standard executive sections
    if (items.length < 3 && customSections) {
      setTocItems(
        customSections.map((s) => ({
          id: s.id,
          title: s.title,
          level: 2,
        }))
      );
    } else {
      // Append Critic's Review and Cited References if not already present
      const hasCritic = items.some((i) => i.id.includes('critic') || i.id.includes('review'));
      if (!hasCritic) {
        items.push({
          id: 'critic-evaluation-section',
          title: "Critic's Peer Review & Gaps",
          level: 2,
        });
      }

      const hasRefs = items.some((i) => i.id.includes('reference') || i.id.includes('source') || i.id.includes('evidence'));
      if (!hasRefs) {
        items.push({
          id: 'source-audit-section',
          title: 'Cited Sources & Evidence Base',
          level: 2,
        });
      }

      setTocItems(items);
    }
  }, [content, customSections]);

  // Scroll spy to highlight active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const headers = tocItems
        .map((item) => document.getElementById(item.id))
        .filter(Boolean) as HTMLElement[];

      let current = '';
      for (const h of headers) {
        const top = h.getBoundingClientRect().top + scrollY - 140;
        if (scrollY >= top) {
          current = h.id;
        }
      }

      if (current) {
        setActiveId(current);
      } else if (tocItems[0]) {
        setActiveId(tocItems[0].id);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tocItems]);

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const elem = document.getElementById(id);
    if (elem) {
      const topOffset = 100;
      const elemPosition = elem.getBoundingClientRect().top;
      const offsetPosition = elemPosition + window.pageYOffset - topOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setActiveId(id);
    }
  };

  if (tocItems.length === 0) return null;

  return (
    <nav className="report-toc-sidebar no-print" aria-label="Table of Contents">
      <div className="toc-header">
        <Bookmark size={15} className="text-cyan" />
        <span className="toc-title">DOCUMENT NAVIGATION</span>
      </div>

      <ul className="toc-list">
        {tocItems.map((item, index) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id || index} className={`toc-item ${isActive ? 'active' : ''}`}>
              <a
                href={`#${item.id}`}
                onClick={(e) => scrollToSection(e, item.id)}
                className="toc-link"
              >
                <span className="toc-number">{index + 1}.</span>
                <span className="toc-label">{item.title}</span>
                {isActive && <ChevronRight size={12} className="toc-active-indicator" />}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
