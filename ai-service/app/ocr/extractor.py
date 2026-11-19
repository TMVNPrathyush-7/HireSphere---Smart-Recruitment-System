import io
import os
import re
from typing import Optional
import pypdf
import docx

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        text = ""
        uris = []
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
            # Extract clickable hyperlinks embedded in PDF annotations (LinkedIn, GitHub, Portfolio)
            if "/Annots" in page:
                try:
                    for annot in page["/Annots"]:
                        obj = annot.get_object()
                        if "/A" in obj and "/URI" in obj["/A"]:
                            uri = obj["/A"]["/URI"]
                            if uri and isinstance(uri, str) and not uri.startswith("mailto:"):
                                if uri not in uris:
                                    uris.append(uri)
                except Exception:
                    pass

        # Sanitize surrogates and unencodable characters
        clean_text = "".join(ch for ch in text if ord(ch) < 128 or ch.isprintable() or ch in "\n\r\t")
        # Fix common PDF kerning splits (e.g. 'T ravel' -> 'Travel', 'W eb' -> 'Web', 'F ull' -> 'Full', 'T ools' -> 'Tools')
        clean_text = re.sub(r'\b([B-HJ-Zb-hj-z])\s+([a-z]{2,})\b', r'\1\2', clean_text)
        
        # Append hyperlinks found in document metadata so parser accurately associates URLs
        if uris:
            clean_text += "\n\nEmbedded Profile Links:\n" + "\n".join(uris)

        return clean_text.strip()
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""


def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs if paragraph.text])
        return text.strip()
    except Exception as e:
        print(f"Error extracting text from DOCX: {e}")
        return ""

def extract_text_from_file(file_path_or_name: str, file_bytes: Optional[bytes] = None) -> str:
    ext = os.path.splitext(file_path_or_name)[1].lower()
    
    if file_bytes is None and os.path.exists(file_path_or_name):
        with open(file_path_or_name, "rb") as f:
            file_bytes = f.read()

    if not file_bytes:
        return ""

    if ext == ".pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in [".docx", ".doc"]:
        return extract_text_from_docx(file_bytes)
    else:
        try:
            return file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            return ""
