#!/usr/bin/env python3
import json
import re
import os
import unicodedata
import sys
import hashlib
from pathlib import Path
from typing import List, Tuple, Dict, Optional
from PIL import Image

"""
Renomeia imagens numeradas (N-main.ext) para o padrão {handle}-main.ext
E atualiza os paths em data/unified_products.json
Além disso, para produtos com handle "kit-of-3-fragrances-*", renomeia para nomes descritivos
baseados nos itens listados na descrição (ex: "black-opium-yves-saint-laurent-miss-dior-dior-n5-chanel-main.png").

Use --dry-run para apenas listar as renomeações propostas sem aplicar alterações.
"""

# Marcas conhecidas e sinônimos
BRAND_SYNONYMS = {
    'ysl': 'Yves Saint Laurent',
    'yves-saint-laurent': 'Yves Saint Laurent',
    'yves saint laurent': 'Yves Saint Laurent',
    'viktor&rolf': 'Viktor Rolf',
    'viktor & rolf': 'Viktor Rolf',
    'viktor-rolf': 'Viktor Rolf',
    'lancôme': 'Lancome',
    'lancome': 'Lancome',
    'chloé': 'Chloe',
    'chloe': 'Chloe',
    'boss': 'Hugo Boss',
    'bvlgari': 'Bvlgari',
}

KNOWN_BRANDS = {
    'Chanel', 'Dior', 'Carolina Herrera', 'Yves Saint Laurent', 'Versace', 'Paco Rabanne',
    'Jean Paul Gaultier', 'Lancome', 'Giorgio Armani', 'Hugo Boss', 'Chloe', 'Viktor Rolf',
    'Bvlgari', 'Ferrari', 'Azzaro', 'Burberry', 'Prada', 'Gucci', 'Tom Ford', 'Givenchy'
}


def normalize_text(text: str) -> str:
    text = text.strip()
    return text


def remove_diacritics(text: str) -> str:
    return ''.join(
        c for c in unicodedata.normalize('NFKD', text)
        if not unicodedata.combining(c)
    )


def slugify(text: str) -> str:
    if text is None:
        return ''
    text = remove_diacritics(text)
    text = text.strip().lower()
    text = re.sub(r"[\s_/+&]+", "-", text)
    text = re.sub(r"[^a-z0-9\-]", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip('-')


def canonical_brand(raw: str) -> str:
    t = slugify(raw)
    return BRAND_SYNONYMS.get(t, raw.strip())


def split_name_brand(item_text: str) -> Tuple[str, str]:
    t = normalize_text(item_text)
    t_space = re.sub(r"&", " & ", t)

    m = re.search(r"\s+by\s+(.+)$", t_space, flags=re.I)
    if m:
        brand = canonical_brand(m.group(1))
        name = t_space[:m.start()].strip()
        return name, brand

    for b in sorted(KNOWN_BRANDS, key=len, reverse=True):
        if re.match(rf"^{re.escape(b)}\b", t_space, flags=re.I):
            name = t_space[len(b):].strip(" -") or b
            return name.strip(), b
        if re.search(rf"\b{re.escape(b)}$", t_space, flags=re.I):
            name = t_space[: -len(b)].strip(" -") or b
            return name.strip(), b

    return t, ''


def build_descriptive_filename(items: List[str], ext: str) -> str:
    parts = []
    for it in items:
        name, brand = split_name_brand(it)
        name_slug = slugify(name)
        brand_slug = slugify(canonical_brand(brand) if brand else '')
        part = name_slug
        if brand_slug:
            part = f"{name_slug}-{brand_slug}"
        if part:
            parts.append(part)
    base = '-'.join([p for p in parts if p]) or 'combo-of-3-fragrances'
    return f"{base}-main.{ext}"


def extract_items_from_description(desc_html: str) -> List[str]:
    if not desc_html:
        return []
    strongs = re.findall(r"<strong>(.*?)</strong>", desc_html, flags=re.I | re.S)
    strongs = [re.sub(r"<[^>]+>", "", s).strip() for s in strongs]
    return [s for s in strongs if s]


# Analysis utilities for cross-referencing images
COMBOS_MAIN_DIR = (Path(__file__).resolve().parent.parent / 'public' / 'images' / 'products' / 'combos' / 'main')
ALLOWED_EXTS = {'.png', '.jpg', '.jpeg', '.webp'}


def compute_file_hash(path: Path, chunk_size: int = 65536) -> str:
    h = hashlib.sha1()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(chunk_size), b''):
            h.update(chunk)
    return h.hexdigest()


def list_combo_images() -> Tuple[List[Path], List[Path]]:
    if not COMBOS_MAIN_DIR.exists():
        return [], []
    files: List[Path] = []
    for name in os.listdir(COMBOS_MAIN_DIR):
        p = COMBOS_MAIN_DIR / name
        if p.is_file() and p.suffix.lower() in ALLOWED_EXTS:
            files.append(p)
    numeric: List[Path] = []
    descriptive: List[Path] = []
    for f in files:
        base = f.stem
        if re.match(r"^kit-of-3-fragrances-\d+-main$", base, flags=re.I):
            numeric.append(f)
        else:
            descriptive.append(f)
    return numeric, descriptive


def crossref_numeric_with_descriptive() -> Dict[str, Optional[str]]:
    numeric, descriptive = list_combo_images()
    hash_to_desc: Dict[str, List[str]] = {}
    for f in descriptive:
        try:
            h = compute_file_hash(f)
            hash_to_desc.setdefault(h, []).append(f.name)
        except Exception:
            continue
    mapping: Dict[str, Optional[str]] = {}
    for nf in numeric:
        try:
            h = compute_file_hash(nf)
        except Exception:
            mapping[nf.name] = None
            continue
        candidates = hash_to_desc.get(h, [])
        chosen: Optional[str] = None
        if candidates:
            candidates_sorted = sorted(candidates, key=len, reverse=True)
            chosen = candidates_sorted[0]
        mapping[nf.name] = chosen
    return mapping


# Perceptual hashing utilities (dHash)
def image_dhash(path: Path, hash_size: int = 8) -> int:
    try:
        with Image.open(path) as img:
            try:
                resample = Image.Resampling.LANCZOS
            except AttributeError:
                resample = Image.LANCZOS
            img = img.convert('L').resize((hash_size + 1, hash_size), resample)
            pixels = list(img.getdata())
            diff = []
            for row in range(hash_size):
                row_start = row * (hash_size + 1)
                for col in range(hash_size):
                    left = pixels[row_start + col]
                    right = pixels[row_start + col + 1]
                    diff.append(1 if left > right else 0)
            h = 0
            for bit in diff:
                h = (h << 1) | bit
            return h
    except Exception:
        return -1


def hamming_distance(a: int, b: int) -> int:
    if a < 0 or b < 0:
        return 64
    x = a ^ b
    count = 0
    while x:
        x &= x - 1
        count += 1
    return count


def crossref_by_phash(threshold: int = 10):
    numeric, descriptive = list_combo_images()
    desc_entries = []
    for d in descriptive:
        ph = image_dhash(d)
        if ph >= 0:
            desc_entries.append((d.name, d, ph))
    if not desc_entries:
        print('No descriptive images with valid perceptual hash found.')
        return
    print(f'Total descriptive images: {len(desc_entries)}')

    results = []
    for n in numeric:
        nph = image_dhash(n)
        best_dist = 999
        best_name = None
        for desc_name, desc_path, dph in desc_entries:
            dist = hamming_distance(nph, dph)
            if dist < best_dist:
                best_dist = dist
                best_name = desc_name
        results.append((n.name, best_name, best_dist))

    matched = 0
    for nname, dname, dist in sorted(results, key=lambda x: x[0]):
        if dname is not None and dist <= threshold:
            conf = 'HIGH' if dist <= 5 else ('MEDIUM' if dist <= 10 else 'LOW')
            print(f'MATCH(phash {dist:02d}, {conf}): {nname} -> {dname}')
            matched += 1
        else:
            print(f'NO RELIABLE MATCH: {nname} (best candidate {dname} with distance {dist})')

    print('')
    print('Summary (perceptual hash):')
    print(f'Total numeric kit images: {len(results)}')
    print(f'Matched within threshold (<= {threshold}): {matched}')
    print(f'Unmatched: {len(results) - matched}')


def main():
    args = sys.argv[1:]
    dry_run = '--dry-run' in args
    crossref_mode = '--crossref' in args or '--analyze-images' in args
    crossref_phash_mode = '--crossref-phash' in args

    if crossref_mode:
        print('Cross-referencing numeric kit images with descriptive images (by file hash) ...')
        mapping = crossref_numeric_with_descriptive()
        unmatched: List[str] = []
        for src, dst in sorted(mapping.items()):
            if dst:
                print(f"MATCH: {src} -> {dst}")
            else:
                print(f"NO MATCH: {src} -> (no descriptive duplicate found)")
                unmatched.append(src)
        print('')
        print('Summary:')
        total = len(mapping)
        matched = sum(1 for v in mapping.values() if v)
        print(f"Total numeric kit images: {total}")
        print(f"Matched to existing descriptive images: {matched}")
        print(f"Unmatched: {total - matched}")
        if unmatched:
            print('Unmatched list:')
            for u in unmatched:
                print(f" - {u}")
        return 0

    if crossref_phash_mode:
        print('Cross-referencing numeric kit images with descriptive images (by perceptual hash) ...')
        crossref_by_phash(threshold=10)
        return 0

    base_dir = Path(__file__).resolve().parent.parent
    data_path = base_dir / 'data' / 'unified_products.json'
    public_dir = base_dir / 'public'

    combos_main_dir = public_dir / 'images' / 'products' / 'combos' / 'main'
    pattern_numeric = re.compile(r"^/images/products/combos/main/(\d+)-main\.(png|jpg|webp)$", re.IGNORECASE)
    pattern_generic = re.compile(r"^/images/products/combos/main/(kit-of-3-fragrances-(\d+)-main)\.(png|jpg|webp)$", re.IGNORECASE)

    if not data_path.exists():
        print(f"❌ JSON não encontrado: {data_path}")
        return 1
    if not combos_main_dir.exists():
        print(f"❌ Pasta não encontrada: {combos_main_dir}")
        return 1

    data = json.loads(data_path.read_text(encoding='utf-8'))
    products = data.get('products', [])

    renamed = []
    descriptive_renamed = []
    updated = 0

    # 1) Renomear numeradas N-main -> {handle}-main
    for p in products:
        images = p.get('images') or {}
        mains = images.get('main') or []
        if not mains:
            continue
        current = mains[0]
        m = pattern_numeric.match(current)
        if not m:
            continue
        num = m.group(1)
        ext = m.group(2).lower()

        handle = p.get('handle') or ''
        new_base = slugify(str(handle)) or slugify(str(p.get('title') or f'combo-{num}'))
        new_filename = f"{new_base}-main.{ext}"
        new_rel_path = f"/images/products/combos/main/{new_filename}"

        src_fs = combos_main_dir / f"{num}-main.{ext}"
        dst_fs = combos_main_dir / new_filename

        if src_fs.resolve() == dst_fs.resolve():
            if current != new_rel_path:
                if dry_run:
                    renamed.append((os.path.basename(current), new_filename))
                else:
                    p['images']['main'][0] = new_rel_path
                    updated += 1
            continue

        final_dst = dst_fs
        if final_dst.exists():
            base_no_ext = new_filename.rsplit('.', 1)[0]
            i = 2
            while True:
                candidate = combos_main_dir / f"{base_no_ext}-{i}.{ext}"
                if not candidate.exists():
                    final_dst = candidate
                    new_rel_path = f"/images/products/combos/main/{candidate.name}"
                    break
                i += 1

        if src_fs.exists():
            if dry_run:
                renamed.append((src_fs.name, final_dst.name))
            else:
                os.rename(src_fs, final_dst)
                renamed.append((src_fs.name, final_dst.name))
                p['images']['main'][0] = new_rel_path
                updated += 1
        else:
            print(f"⚠️ Arquivo não encontrado para renomear: {src_fs}")

    # 2) Para handles kit-of-3-fragrances-*, renomear para descritivos a partir da descrição
    for p in products:
        handle = p.get('handle') or ''
        if not handle.startswith('kit-of-3-fragrances'):
            continue
        images = p.get('images') or {}
        mains = images.get('main') or []
        if not mains:
            continue
        current = mains[0]
        mg = pattern_generic.match(current)
        src_name = None
        ext = None
        if not mg:
            m2 = re.match(r"^/images/products/combos/main/(kit-of-3-fragrances-\d+)-main\.(png|jpg|webp)$", current, flags=re.I)
            if m2:
                ext = m2.group(2).lower()
                src_name = f"{m2.group(1)}-main.{ext}"
        else:
            ext = mg.group(3).lower()
            src_name = f"{mg.group(1)}.{ext}"
        if not src_name:
            continue

        desc_html = p.get('description_html') or p.get('description') or ''
        items = extract_items_from_description(desc_html)
        if not items:
            continue
        new_filename = build_descriptive_filename(items, ext)
        new_rel_path = f"/images/products/combos/main/{new_filename}"

        src_fs = combos_main_dir / src_name
        dst_fs = combos_main_dir / new_filename
        if src_fs.exists():
            if dst_fs.exists() and src_fs.resolve() != dst_fs.resolve():
                base_no_ext = new_filename.rsplit('.', 1)[0]
                i = 2
                while True:
                    candidate = combos_main_dir / f"{base_no_ext}-{i}.{ext}"
                    if not candidate.exists():
                        dst_fs = candidate
                        new_rel_path = f"/images/products/combos/main/{candidate.name}"
                        break
                    i += 1
            if dry_run:
                descriptive_renamed.append((src_fs.name, dst_fs.name))
            else:
                os.rename(src_fs, dst_fs)
                descriptive_renamed.append((src_fs.name, dst_fs.name))
                p['images']['main'][0] = new_rel_path
                updated += 1
        else:
            if dst_fs.exists() and not dry_run:
                p['images']['main'][0] = new_rel_path
                updated += 1

    if renamed:
        print("✅ Renomeações propostas/realizadas (numéricas -> handle):")
        for a, b in renamed:
            print(f" - {a} -> {b}")
    else:
        print("ℹ️ Nenhuma renomeação numérica necessária")

    if descriptive_renamed:
        print("✅ Renomeações propostas/realizadas (kit-of-3-fragrances-* -> baseado na descrição):")
        for a, b in descriptive_renamed:
            print(f" - {a} -> {b}")
    else:
        print("ℹ️ Nenhuma renomeação descritiva necessária")

    if not dry_run and updated:
        data_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f"💾 JSON atualizado: {data_path} (produtos atualizados: {updated})")
    elif dry_run:
        print("(Modo dry-run) Nenhuma mudança aplicada. Apenas visualização da lista.")
    else:
        print("ℹ️ Nenhuma atualização no JSON necessária")

    return 0


if __name__ == '__main__':
    raise SystemExit(main())