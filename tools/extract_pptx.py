#!/usr/bin/env python3
"""
把 7 个 PPT 教程导出成结构化 JSON，供人工校订与撰写网页内容使用。

导出内容：
  - 每页的标题、正文文本块（按位置排序，还原阅读顺序与分组）
  - 演讲者备注（逐字）
  - 识别出的代码块（含原文与缺陷标记）
  - 每页的配色（还原 PPT 的代码高亮用色）

用法：python3 tools/extract_pptx.py
输出：tools/out/ch{N}.json  +  tools/out/summary.txt
"""
import json
import os
import re
import sys
import glob
from pptx import Presentation
from pptx.util import Emu

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.dirname(os.path.dirname(HERE))  # python/
OUT = os.path.join(HERE, "out")

# 按文件名前缀排序，统一重编为第 1–7 章
CHAPTERS = [
    ("第一章", "变量与基本运算", "Python 语法的基石：数据类型、变量、运算符"),
    ("第二章", "控制逻辑流", "条件分支、循环结构、推导式"),
    ("第三章", "组合数据容器", "列表、元组、字典、集合"),
    ("第四章", "代码复用", "函数与模块"),
    ("第五章", "标准库与第三方库", "站在前人的肩膀上"),
    ("第六章", "文件读写与异常", "让程序有记忆、能应对意外"),
    ("第七章", "面向对象", "以映射世界的方式设计程序"),
]

# 代码识别：这些模式出现即很可能是代码
CODE_SIGNALS = re.compile(
    r"(^\s*#)|(\bdef\s+\w)|(\bclass\s+\w)|(\bimport\s+\w)|(\bfrom\s+\w+\s+import)|"
    r"(\bfor\s+\w+\s+in\b)|(\bwhile\s+\w)|(\bprint\()|(\bif\s+.+:)|(\bwith\s+open)|"
    r"(\btry:)|(\bexcept\b)|(\breturn\b)|(\bpip\s+\w)"
)
DEFECTS = {
    "smart_quote": re.compile(r"[“”‘’]"),
    "slash_comment": re.compile(r"//"),
    "missing_indent": re.compile(r"^\s*(print|return|break|continue|pass)\b"),
    "tight_equals": re.compile(r"\w=(?!=)|\s=(?!=)\s"),
    "chinese_punct_in_code": re.compile(r"[，。！？；：（）【】]"),
}


def para_text(p):
    """还原段落文本，保留行内换行符。"""
    parts = []
    for child in p._p:
        tag = child.tag.split("}")[-1]
        if tag == "br":
            parts.append("\n")
        elif tag == "r":
            t = child.find(".//{http://schemas.openxmlformats.org/drawingml/2006/main}t")
            if t is not None and t.text:
                parts.append(t.text)
    return "".join(parts)


def shape_paragraphs(sh):
    """取形状全部段落（保留空行与缩进信息）。"""
    if not sh.has_text_frame:
        return []
    out = []
    for p in sh.text_frame.paragraphs:
        txt = para_text(p)
        if txt.strip():
            # 记录原始缩进层级（PPT 的 level，不是空格）
            out.append({"text": txt, "level": p.level or 0})
    return out


def walk(shapes, depth=0):
    for sh in shapes:
        yield sh, depth
        if sh.shape_type == 6:  # GROUP
            try:
                yield from walk(sh.shapes, depth + 1)
            except Exception:
                pass


def collect_runs_color(sh):
    """收集形状里用到的文字颜色，用于还原代码配色。"""
    colors = []
    if not sh.has_text_frame:
        return colors
    for p in sh.text_frame.paragraphs:
        for r in p.runs:
            try:
                if r.font.color and r.font.color.type is not None:
                    colors.append(str(r.font.color.rgb))
            except Exception:
                pass
    return colors


def find_code_shape(paras):
    """判断一组段落是否为代码块。"""
    if not paras:
        return False
    hits = sum(1 for p in paras if CODE_SIGNALS.search(p["text"]))
    return hits >= 2 or (hits >= 1 and len(paras) <= 3)


def mark_defects(code_text):
    """标记代码原文中的缺陷，供人工校订时逐条修正。"""
    found = []
    for name, pat in DEFECTS.items():
        if pat.search(code_text):
            found.append(name)
    return found


def extract(path, meta):
    prs = Presentation(path)
    slides = []
    for idx, slide in enumerate(prs.slides, 1):
        blocks = []
        for sh, depth in walk(slide.shapes):
            paras = shape_paragraphs(sh)
            if not paras:
                continue
            try:
                pos = {
                    "x": round(Emu(sh.left).inches, 2) if sh.left is not None else None,
                    "y": round(Emu(sh.top).inches, 2) if sh.top is not None else None,
                    "w": round(Emu(sh.width).inches, 2) if sh.width is not None else None,
                    "h": round(Emu(sh.height).inches, 2) if sh.height is not None else None,
                }
            except Exception:
                pos = {"x": None, "y": None, "w": None, "h": None}

            text = "\n".join(p["text"] for p in paras)
            is_code = find_code_shape(paras)
            entry = {
                "text": text,
                "lines": [p["text"] for p in paras],
                "pos": pos,
                "depth": depth,
                "is_code": is_code,
                "colors": sorted(set(collect_runs_color(sh))),
            }
            if is_code:
                entry["defects"] = mark_defects(text)
            blocks.append(entry)

        # 按位置排序还原阅读顺序：先上后下，再左到右
        blocks.sort(key=lambda b: (b["pos"]["y"] if b["pos"]["y"] is not None else 999,
                                   b["pos"]["x"] if b["pos"]["x"] is not None else 999))

        notes = ""
        if slide.has_notes_slide:
            notes = slide.notes_slide.notes_text_frame.text.strip()

        # 标题猜测：最大的字号 / 最靠上的非代码块
        title = None
        for b in blocks:
            if not b["is_code"] and b["pos"]["y"] is not None and b["pos"]["y"] < 2.0:
                title = b["lines"][0]
                break
        if title is None and blocks:
            title = blocks[0]["lines"][0]

        slides.append({
            "n": idx,
            "title_guess": title,
            "notes": notes,
            "blocks": blocks,
            "code_blocks": [b for b in blocks if b["is_code"]],
        })

    return {"chapter": meta["num"], "name": meta["name"], "subtitle": meta["subtitle"],
            "source": os.path.basename(path), "slide_count": len(slides), "slides": slides}


def main():
    os.makedirs(OUT, exist_ok=True)
    files = sorted(glob.glob(os.path.join(SRC, "第*章*.pptx")))
    # 按 CHAPTERS 定义的前缀顺序排列
    ordered = []
    for prefix, name, subtitle in CHAPTERS:
        for f in files:
            if os.path.basename(f).startswith(prefix):
                ordered.append((f, {"num": len(ordered) + 1, "name": name, "subtitle": subtitle}))
                break

    summary = []
    for path, meta in ordered:
        data = extract(path, meta)
        dest = os.path.join(OUT, f"ch{meta['num']}.json")
        with open(dest, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        ncode = sum(len(s["code_blocks"]) for s in data["slides"])
        nnotes = sum(1 for s in data["slides"] if s["notes"])
        summary.append(
            f"ch{meta['num']}  {meta['name']:<12} {data['slide_count']:>3} 页  "
            f"代码块 {ncode:>2}  备注 {nnotes:>2}/{data['slide_count']}  <- {os.path.basename(path)}"
        )

    with open(os.path.join(OUT, "summary.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(summary) + "\n")
    print("\n".join(summary))
    print(f"\n输出目录: {OUT}")


if __name__ == "__main__":
    main()
