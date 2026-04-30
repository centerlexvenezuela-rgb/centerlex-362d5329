import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
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
  const paragraphs = htmlToPlainParagraphs(html);
  const children: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 32, font: "Times New Roman" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
  ];

  paragraphs.forEach((p) => {
    if (!p.text) { children.push(new Paragraph({ text: "" })); return; }
    const align = p.align === "center" ? AlignmentType.CENTER : p.align === "right" ? AlignmentType.RIGHT : p.align === "justify" ? AlignmentType.JUSTIFIED : AlignmentType.LEFT;
    if (p.heading) {
      children.push(new Paragraph({
        children: [new TextRun({ text: p.text, bold: true, font: "Times New Roman", size: p.heading === 1 ? 32 : p.heading === 2 ? 28 : 26 })],
        heading: p.heading === 1 ? HeadingLevel.HEADING_1 : p.heading === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
        alignment: align,
        spacing: { before: 200, after: 120 },
      }));
    } else {
      children.push(new Paragraph({
        children: [new TextRun({ text: p.text, font: "Times New Roman", size: 24 })],
        alignment: align,
        spacing: { after: 120 },
      }));
    }
  });

  const doc = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title.replace(/[^\w\d-_ ]/g, "")}.docx`);
};

export const copyHtmlAsText = async (html: string) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  await navigator.clipboard.writeText(div.innerText);
};
