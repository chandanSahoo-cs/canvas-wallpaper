def srgb_to_luminance(hex_str):
    hex_str = hex_str.lstrip('#')
    if len(hex_str) == 6:
        r, g, b = [int(hex_str[i:i+2], 16) / 255.0 for i in (0, 2, 4)]
    elif len(hex_str) == 8:
        r, g, b = [int(hex_str[i:i+2], 16) / 255.0 for i in (0, 2, 4)]
    elif len(hex_str) == 3:
        r, g, b = [int(c*2, 16) / 255.0 for c in hex_str]
    else:
        raise ValueError(f"Unknown hex {hex_str}")

    def channel_lum(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return 0.2126 * channel_lum(r) + 0.7152 * channel_lum(g) + 0.0722 * channel_lum(b)

def contrast_ratio(hex1, hex2):
    l1 = srgb_to_luminance(hex1)
    l2 = srgb_to_luminance(hex2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

# Light theme tokens candidate
light = {
    "paper": "#F6FAF8",
    "surface": "#FFFFFF",
    "ink": "#0E1A1F",
    "muted": "#52636A",  # test contrast on paper & surface
    "line": "#0E1A1F",
    "blue": "#46BAEB",
    "green": "#00BF63",
    "blue_text": "#137298", # slightly darker than #1A7FA8 to guarantee >= 4.5:1
    "green_text": "#00834A",
    "on_accent": "#0E1A1F",
    "danger": "#D92D20",
    "warning": "#B54708",
}

# Dark theme tokens candidate
dark = {
    "paper": "#0E1A1F",
    "surface": "#15262D",
    "ink": "#EAF4F1",
    "muted": "#96AAB0",
    "line": "#3D525A", # 75% ink blend on dark surface
    "blue": "#46BAEB",
    "green": "#00BF63",
    "blue_text": "#46BAEB",
    "green_text": "#00BF63",
    "on_accent": "#0E1A1F",
    "danger": "#F97066",
    "warning": "#FDB022",
}

print("=== LIGHT THEME CONTRAST CHECK ===")
light_checks = [
    ("ink on paper", light["ink"], light["paper"], 4.5),
    ("ink on surface", light["ink"], light["surface"], 4.5),
    ("muted on paper", light["muted"], light["paper"], 4.5),
    ("muted on surface", light["muted"], light["surface"], 4.5),
    ("blue_text on paper", light["blue_text"], light["paper"], 4.5),
    ("blue_text on surface", light["blue_text"], light["surface"], 4.5),
    ("green_text on paper", light["green_text"], light["paper"], 4.5),
    ("green_text on surface", light["green_text"], light["surface"], 4.5),
    ("danger on paper", light["danger"], light["paper"], 4.5),
    ("danger on surface", light["danger"], light["surface"], 4.5),
    ("warning on paper", light["warning"], light["paper"], 4.5),
    ("warning on surface", light["warning"], light["surface"], 4.5),
    ("on_accent on blue", light["on_accent"], light["blue"], 4.5),
    ("on_accent on green", light["on_accent"], light["green"], 4.5),
    ("line on paper (UI border)", light["line"], light["paper"], 3.0),
    ("line on surface (UI border)", light["line"], light["surface"], 3.0),
    ("white on blue (FAIL test)", "#FFFFFF", light["blue"], 4.5),
    ("white on green (FAIL test)", "#FFFFFF", light["green"], 4.5),
]

for label, fg, bg, req in light_checks:
    cr = contrast_ratio(fg, bg)
    status = "PASS" if cr >= req else "FAIL"
    print(f"[{status}] {label:30} {fg} on {bg}: {cr:.2f}:1 (target >={req}:1)")

print("\n=== DARK THEME CONTRAST CHECK ===")
dark_checks = [
    ("ink on paper", dark["ink"], dark["paper"], 4.5),
    ("ink on surface", dark["ink"], dark["surface"], 4.5),
    ("muted on paper", dark["muted"], dark["paper"], 4.5),
    ("muted on surface", dark["muted"], dark["surface"], 4.5),
    ("blue_text on paper", dark["blue_text"], dark["paper"], 4.5),
    ("blue_text on surface", dark["blue_text"], dark["surface"], 4.5),
    ("green_text on paper", dark["green_text"], dark["paper"], 4.5),
    ("green_text on surface", dark["green_text"], dark["surface"], 4.5),
    ("danger on paper", dark["danger"], dark["paper"], 4.5),
    ("danger on surface", dark["danger"], dark["surface"], 4.5),
    ("warning on paper", dark["warning"], dark["paper"], 4.5),
    ("warning on surface", dark["warning"], dark["surface"], 4.5),
    ("on_accent on blue", dark["on_accent"], dark["blue"], 4.5),
    ("on_accent on green", dark["on_accent"], dark["green"], 4.5),
    ("line on paper (UI border)", dark["line"], dark["paper"], 1.5),
    ("line on surface (UI border)", dark["line"], dark["surface"], 1.5),
]

for label, fg, bg, req in dark_checks:
    cr = contrast_ratio(fg, bg)
    status = "PASS" if cr >= req else "FAIL"
    print(f"[{status}] {label:30} {fg} on {bg}: {cr:.2f}:1 (target >={req}:1)")
