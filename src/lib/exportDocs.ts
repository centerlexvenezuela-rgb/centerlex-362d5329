import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, SectionType, LineRuleType } from "docx";
import { saveAs } from "file-saver";

// Strip HTML to text segments (very lightweight, no external sanitizer needed for export)
const htmlToPlainParagraphs = (html: string): { text: string; heading?: 1 | 2 | 3; align?: "left"|"center"|"right"|"justify" }[] => {
  const div = document.createElement("div");
  div.innerHTML = html;
  const out: { text: string; heading?: 1 | 2 | 3; align?: any }[] = [];
  div.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent?.trim();
      if (t) out.push({ text: t });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const align = (el.style.textAlign || el.getAttribute("style")?.match(/text-align:\s*(\w+)/)?.[1]) as any;
      const text = el.textContent?.trim() || "";
      if (!text) { out.push({ text: "" }); return; }
      if (tag === "h1") out.push({ text, heading: 1, align });
      else if (tag === "h2") out.push({ text, heading: 2, align });
      else if (tag === "h3") out.push({ text, heading: 3, align });
      else if (tag === "ul" || tag === "ol") {
        el.querySelectorAll("li").forEach((li, i) => {
          out.push({ text: (tag === "ol" ? `${i + 1}. ` : "• ") + (li.textContent || "") });
        });
      } else {
        out.push({ text, align });
      }
    }
  });
  return out;
};

export const exportToPDF = (title: string, html: string) => {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 60;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.text(title, margin, y);
  y += 28;
  doc.setFont("times", "normal");
  doc.setFontSize(12);

  const paragraphs = htmlToPlainParagraphs(html);
  paragraphs.forEach((p) => {
    if (!p.text) { y += 10; return; }
    if (p.heading) {
      doc.setFont("times", "bold");
      doc.setFontSize(p.heading === 1 ? 16 : p.heading === 2 ? 14 : 13);
    } else {
      doc.setFont("times", "normal");
      doc.setFontSize(12);
    }
    const lines = doc.splitTextToSize(p.text, width);
    lines.forEach((line: string) => {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      const align = p.align === "center" ? "center" : p.align === "right" ? "right" : p.align === "justify" ? "justify" : "left";
      const x = align === "center" ? doc.internal.pageSize.getWidth() / 2 : align === "right" ? doc.internal.pageSize.getWidth() - margin : margin;
      doc.text(line, x, y, { align: align as any, maxWidth: width });
      y += p.heading ? 22 : 18;
    });
    y += 6;
  });

  doc.save(`${title.replace(/[^\w\d-_ ]/g, "")}.pdf`);
};

export const exportToDocx = async (title: string, html: string) => {
  type AlignmentValue = (typeof AlignmentType)[keyof typeof AlignmentType];
  type JudicialLine = { text: string; bold?: boolean; alignment?: AlignmentValue };
  const PAGE_WIDTH_DXA = 12_240;
  const PAGE_HEIGHT_DXA = 18_720;
  const MARGIN_SIDE_DXA = 1_417;
  const MARGIN_TOP_DXA = 2_835;
  const MARGIN_BOTTOM_DXA = 1_134;
  const CONTENT_WIDTH_PX = ((PAGE_WIDTH_DXA - (MARGIN_SIDE_DXA * 2)) / 1_440) * 96;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (context) context.font = "16px Arial";
  const measure = (text: string) => context?.measureText(text).width ?? text.length * 8;

  const wrap = (text: string, prefix = ""): string[] => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return [""];
    const lines: string[] = [];
    let line = prefix;
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate) <= CONTENT_WIDTH_PX) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      if (measure(word) <= CONTENT_WIDTH_PX) {
        line = word;
        continue;
      }
      let fragment = "";
      for (const character of word) {
        if (fragment && measure(fragment + character) > CONTENT_WIDTH_PX) {
          lines.push(fragment);
          fragment = character;
        } else {
          fragment += character;
        }
      }
      line = fragment;
    }
    if (line) lines.push(line);
    return lines;
  };

  const lines: JudicialLine[] = wrap(title).map((text) => ({
    text,
    bold: true,
    alignment: AlignmentType.CENTER,
  }));
  const paragraphs = htmlToPlainParagraphs(html);
  paragraphs.forEach((paragraph) => {
    if (!paragraph.text) {
      lines.push({ text: "", alignment: AlignmentType.JUSTIFIED });
      return;
    }
    const normalized = paragraph.text.replace(/^•\s*/, "- ");
    wrap(normalized).forEach((text) => lines.push({
      text,
      bold: Boolean(paragraph.heading),
      alignment: paragraph.align === "center"
        ? AlignmentType.CENTER
        : paragraph.align === "right"
          ? AlignmentType.RIGHT
          : AlignmentType.JUSTIFIED,
    }));
  });

  const pages: JudicialLine[][] = [];
  let offset = 0;
  while (offset < lines.length) {
    const pageNumber = pages.length + 1;
    const capacity = pageNumber % 2 === 1 ? 30 : 34;
    pages.push(lines.slice(offset, offset + capacity));
    offset += capacity;
  }
  if (pages.length === 0) pages.push([]);

  const sections = pages.map((pageLines, index) => {
    const pageNumber = index + 1;
    const lineSpacing = pageNumber % 2 === 1 ? 491 : 433;
    return {
      properties: {
        type: index === 0 ? undefined : SectionType.NEXT_PAGE,
        page: {
          size: { width: PAGE_WIDTH_DXA, height: PAGE_HEIGHT_DXA },
          margin: {
            top: MARGIN_TOP_DXA,
            right: MARGIN_SIDE_DXA,
            bottom: MARGIN_BOTTOM_DXA,
            left: MARGIN_SIDE_DXA,
          },
        },
      },
      children: pageLines.map((line) => new Paragraph({
        children: [new TextRun({ text: line.text, bold: line.bold, font: "Arial", size: 24 })],
        alignment: line.alignment ?? AlignmentType.JUSTIFIED,
        spacing: { before: 0, after: 0, line: lineSpacing, lineRule: LineRuleType.EXACT },
      })),
    };
  });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 24 } } } },
    sections,
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title.replace(/[^\w\d-_ ]/g, "")}.docx`);
};

export const copyHtmlAsText = async (html: string) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  await navigator.clipboard.writeText(div.innerText);
};
