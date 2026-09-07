# -*- coding: utf-8 -*-
"""
كاتب PSD بسيط ومطابق للمواصفة — RGB 8-bit بطبقات شفافة.

اتكتب بالإيد لأن pytoshop بيطلّع ملفات فوتوشوب بيرفضها
("not compatible with this version"). ده بيستخدم ضغط RLE/PackBits
اللي هو الأكثر توافقًا عبر نسخ فوتوشوب.
"""
import struct, io
import numpy as np


def packbits(data: bytes) -> bytes:
    """ضغط PackBits — نفس اللي فوتوشوب بيستخدمه في RLE."""
    out = bytearray()
    i, n = 0, len(data)
    while i < n:
        # طول تكرار البايت الحالي
        j = i
        while j + 1 < n and data[j] == data[j + 1]:
            j += 1
        run = j - i + 1
        if run >= 2:
            while run >= 2:
                k = min(run, 128)
                if run - k == 1:             # متسيبش باقي = 1، مينفعش يتكتب كتكرار
                    k -= 1
                out.append(257 - k)          # -k+1 كبايت مؤشَّر
                out.append(data[i])
                i += k
                run -= k
            if run == 1:                     # الباقي الفردي يتكتب حرفي
                out.append(0)
                out.append(data[i])
                i += 1
        else:
            # سلسلة حرفية لحد ما نلاقي تكرار 3 أو نوصل 128
            j = i
            while j < n:
                if j + 2 < n and data[j] == data[j + 1] == data[j + 2]:
                    break
                j += 1
                if j - i == 128:
                    break
            out.append(j - i - 1)
            out += data[i:j]
            i = j
    return bytes(out)


def _uniform_row(val: int, n: int) -> bytes:
    """سطر كله نفس القيمة — نكتب الـRLE مباشرة من غير مسح.
    ده بيسرّع الطبقات الشفافة جدًا (وهي أغلب الطبقات)."""
    out = bytearray()
    while n > 0:
        k = min(n, 128)
        if n - k == 1:
            k -= 1
        if k >= 2:
            out.append(257 - k); out.append(val); n -= k
        else:
            out.append(0); out.append(val); n -= 1
    return bytes(out)


def _rle_channel(chan: np.ndarray):
    """يرجّع (جدول أطوال السطور, البيانات المضغوطة) لقناة واحدة."""
    rows, counts = [], []
    w = chan.shape[1]
    # أول وآخر قيمة في كل سطر — لو متساويين والحد الأدنى = الأقصى يبقى السطر موحّد
    mins = chan.min(axis=1)
    maxs = chan.max(axis=1)
    for y in range(chan.shape[0]):
        if mins[y] == maxs[y]:
            p = _uniform_row(int(mins[y]), w)
        else:
            p = packbits(chan[y].tobytes())
        rows.append(p)
        counts.append(len(p))
    table = b"".join(struct.pack(">H", c) for c in counts)
    return table, b"".join(rows)


def _pascal4(s: str) -> bytes:
    """اسم الطبقة القديم — Pascal string مبطّن لمضاعف 4."""
    b = s.encode("ascii", "replace")[:255]
    raw = bytes([len(b)]) + b
    pad = (-len(raw)) % 4
    return raw + b"\x00" * pad


def _luni(name: str) -> bytes:
    """كتلة الاسم اليونيكودي — عشان العربي يظهر صح في لوحة الطبقات."""
    u = name.encode("utf-16-be")
    data = struct.pack(">I", len(name)) + u
    if len(data) % 2:
        data += b"\x00"
    body = b"8BIM" + b"luni" + struct.pack(">I", len(data)) + data
    return body


def write_psd(path, width, height, layers, flattened):
    """
    layers    : [(اسم, مصفوفة RGBA بشكل (H, W, 4) و dtype=uint8)] — من تحت لفوق
    flattened : مصفوفة RGB بشكل (H, W, 3) — المعاينة المسطّحة
    """
    f = io.BytesIO()

    # ── الترويسة ──
    f.write(b"8BPS")
    f.write(struct.pack(">H", 1))          # النسخة
    f.write(b"\x00" * 6)                   # محجوز
    f.write(struct.pack(">H", 3))          # عدد قنوات الصورة المسطّحة
    f.write(struct.pack(">I", height))
    f.write(struct.pack(">I", width))
    f.write(struct.pack(">H", 8))          # عمق البت
    f.write(struct.pack(">H", 3))          # RGB

    f.write(struct.pack(">I", 0))          # بيانات نمط اللون

    # مورد الدقة: 72 نقطة/بوصة عشان 1 بكسل = 1 نقطة،
    # فأحجام الخط في السكربت تطابق الـCSS بالظبط.
    res = (struct.pack(">I", 72 << 16) + struct.pack(">HH", 1, 1)
           + struct.pack(">I", 72 << 16) + struct.pack(">HH", 1, 1))
    # 8BIM + معرّف المورد + اسم فارغ (بايتين) + الطول + البيانات
    block = (b"8BIM" + struct.pack(">H", 1005) + bytes(2)
             + struct.pack(">I", len(res)) + res)
    f.write(struct.pack(">I", len(block)))
    f.write(block)

    # ── قسم الطبقات ──
    recs = io.BytesIO()
    recs.write(struct.pack(">h", len(layers)))

    chan_blobs = []                        # بيانات القنوات لكل طبقة
    for name, rgba in layers:
        a = np.ascontiguousarray(rgba)
        # الترتيب: ألفا ثم R ثم G ثم B
        chans = [(-1, a[..., 3]), (0, a[..., 0]), (1, a[..., 1]), (2, a[..., 2])]
        blobs = []
        for cid, data in chans:
            table, packed = _rle_channel(np.ascontiguousarray(data))
            blob = struct.pack(">H", 1) + table + packed     # 1 = RLE
            blobs.append((cid, blob))
        chan_blobs.append(blobs)

        recs.write(struct.pack(">iiii", 0, 0, height, width))
        recs.write(struct.pack(">H", len(blobs)))
        for cid, blob in blobs:
            recs.write(struct.pack(">h", cid))
            recs.write(struct.pack(">I", len(blob)))
        recs.write(b"8BIM")
        recs.write(b"norm")
        recs.write(bytes([255]))           # العتامة
        recs.write(bytes([0]))             # clipping
        recs.write(bytes([0]))             # flags — bit1=مخفية، 0 يعني مرئية
        recs.write(bytes([0]))             # حشو

        extra = _pascal4(name) + _luni(name)
        extra = struct.pack(">I", 0) + struct.pack(">I", 0) + extra   # قناع + مدى المزج
        recs.write(struct.pack(">I", len(extra)))
        recs.write(extra)

    for blobs in chan_blobs:
        for _, blob in blobs:
            recs.write(blob)

    layer_info = recs.getvalue()
    if len(layer_info) % 2:
        layer_info += b"\x00"

    lmi = struct.pack(">I", len(layer_info)) + layer_info
    lmi += struct.pack(">I", 0)            # قناع الطبقات العام
    f.write(struct.pack(">I", len(lmi)))
    f.write(lmi)

    # ── الصورة المسطّحة (المعاينة) ──
    flat = np.ascontiguousarray(flattened)
    tables, datas = [], []
    for c in range(3):
        t, d = _rle_channel(np.ascontiguousarray(flat[..., c]))
        tables.append(t)
        datas.append(d)
    f.write(struct.pack(">H", 1))
    f.write(b"".join(tables))
    f.write(b"".join(datas))

    with open(path, "wb") as fh:
        fh.write(f.getvalue())
