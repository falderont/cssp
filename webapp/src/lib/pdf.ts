// A minimal, dependency-free PDF writer. Good enough for the plain-text
// demo documents this app generates (SLA reports, contracts, sign-off
// certificates) without pulling in a full PDF library. `makePdfWithImage`
// additionally embeds a single baseline JPEG (used for the remote-hands
// sign-off signature) via a raw DCTDecode XObject.

function escapePdfText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function makeSimplePdf(title: string, lines: string[]): Buffer {
  const allLines = [title, "", ...lines];
  const streamParts: string[] = ["BT", "/F1 16 Tf", "50 760 Td"];
  allLines.forEach((line, i) => {
    if (i === 1) streamParts.push("/F1 11 Tf");
    if (i > 0) streamParts.push("0 -20 Td");
    streamParts.push(`(${escapePdfText(line)}) Tj`);
  });
  streamParts.push("ET");
  const stream = streamParts.join("\n");

  const bufferParts: string[] = ["%PDF-1.4\n"];
  const offsets: number[] = [];

  function addObj(index: number, body: string) {
    offsets[index] = Buffer.byteLength(bufferParts.join(""), "latin1");
    bufferParts.push(`${index} 0 obj\n${body}\nendobj\n`);
  }

  addObj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  addObj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  addObj(
    3,
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>"
  );
  addObj(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  addObj(5, `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`);

  const xrefOffset = Buffer.byteLength(bufferParts.join(""), "latin1");
  let xref = "xref\n0 6\n0000000000 65535 f \n";
  for (let i = 1; i <= 5; i++) xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  bufferParts.push(xref);
  bufferParts.push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return Buffer.from(bufferParts.join(""), "latin1");
}

export function makePdfWithImage(
  title: string,
  lines: string[],
  image: { jpegBuffer: Buffer; widthPx: number; heightPx: number },
  imageCaption = "Customer signature"
): Buffer {
  const allLines = [title, "", ...lines];
  const textStream: string[] = ["BT", "/F1 16 Tf", "50 740 Td"];
  allLines.forEach((line, i) => {
    if (i === 1) textStream.push("/F1 10 Tf");
    if (i > 0) textStream.push("0 -16 Td");
    textStream.push(`(${escapePdfText(line)}) Tj`);
  });
  textStream.push("ET");

  const maxW = 220;
  const maxH = 90;
  const aspect = image.widthPx / image.heightPx || 2;
  let dispW = maxW;
  let dispH = maxW / aspect;
  if (dispH > maxH) {
    dispH = maxH;
    dispW = maxH * aspect;
  }
  const imgY = 110;
  const drawImage = ["q", `${dispW.toFixed(2)} 0 0 ${dispH.toFixed(2)} 50 ${imgY} cm`, "/Im0 Do", "Q"];
  const caption = ["BT", "/F1 9 Tf", `50 ${imgY - 14} Td`, `(${escapePdfText(imageCaption)}) Tj`, "ET"];

  const content = [...textStream, ...drawImage, ...caption].join("\n");
  const imageBinary = image.jpegBuffer.toString("latin1");

  const bufferParts: string[] = ["%PDF-1.4\n"];
  const offsets: number[] = [];

  function addObj(index: number, body: string) {
    offsets[index] = Buffer.byteLength(bufferParts.join(""), "latin1");
    bufferParts.push(`${index} 0 obj\n${body}\nendobj\n`);
  }

  addObj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  addObj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  addObj(
    3,
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> /XObject << /Im0 6 0 R >> >> /Contents 5 0 R >>"
  );
  addObj(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  addObj(5, `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`);
  addObj(
    6,
    `<< /Type /XObject /Subtype /Image /Width ${image.widthPx} /Height ${image.heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.jpegBuffer.byteLength} >>\nstream\n${imageBinary}\nendstream`
  );

  const xrefOffset = Buffer.byteLength(bufferParts.join(""), "latin1");
  let xref = "xref\n0 7\n0000000000 65535 f \n";
  for (let i = 1; i <= 6; i++) xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  bufferParts.push(xref);
  bufferParts.push(`trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return Buffer.from(bufferParts.join(""), "latin1");
}
