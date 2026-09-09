"""
Script para generar la imagen Open Graph oficial de Kidway (og-image.png).
Resolución: 1024x1024 con supersampling 2x para máxima nitidez anti-aliasing.
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SCALE = 2
W, H = 1024 * SCALE, 1024 * SCALE

# Directorio raíz del frontend
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
PUBLIC_DIR = os.path.join(FRONTEND_DIR, 'public')
FAVICON_PATH = os.path.join(PUBLIC_DIR, 'favicon.png')
OUTPUT_PATH = os.path.join(PUBLIC_DIR, 'og-image.png')

# 1. Base Canvas - Deep Pine (#0E2A22)
img = Image.new('RGBA', (W, H), (14, 42, 34, 255))

# 2. Ambient glows
glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)

for r, a in [(950*SCALE, 14), (650*SCALE, 22), (400*SCALE, 32)]:
    cx, cy = int(W * 0.82), int(H * 0.72)
    gd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(24, 226, 153, a))

for r, a in [(550*SCALE, 16), (320*SCALE, 24)]:
    cx, cy = int(W * 0.88), int(H * 0.12)
    gd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(16, 185, 129, a))

for r, a in [(600*SCALE, 25), (350*SCALE, 35)]:
    cx, cy = int(W * 0.1), int(H * 0.85)
    gd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(10, 30, 24, a))

img = Image.alpha_composite(img, glow)

def add_shadow(base_img, box, radius, fill=(0, 20, 15, 65), blur=24*SCALE, offset=(0, 10*SCALE)):
    shadow = Image.new('RGBA', base_img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    bx = [box[0] + offset[0], box[1] + offset[1], box[2] + offset[0], box[3] + offset[1]]
    sd.rounded_rectangle(bx, radius=radius, fill=fill)
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    return Image.alpha_composite(base_img, shadow)

# 3. Logo Card (Top-Left)
logo_box = [70*SCALE, 70*SCALE, 460*SCALE, 460*SCALE]
img = add_shadow(img, logo_box, radius=72*SCALE, fill=(0, 15, 10, 85), blur=28*SCALE, offset=(0, 14*SCALE))

draw = ImageDraw.Draw(img)
draw.rounded_rectangle(logo_box, radius=72*SCALE, fill=(255, 255, 255, 255))

fav = Image.open(FAVICON_PATH).convert('RGBA')
fav_size = 320 * SCALE
fav_res = fav.resize((fav_size, fav_size), Image.Resampling.LANCZOS)
fx = logo_box[0] + (logo_box[2] - logo_box[0] - fav_size) // 2
fy = logo_box[1] + (logo_box[3] - logo_box[1] - fav_size) // 2
img.paste(fav_res, (fx, fy), fav_res)

# 4. Fonts
font_title = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 104 * SCALE)
font_sub = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 44 * SCALE)
font_pill = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 26 * SCALE)
font_foot_bold = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 38 * SCALE)
font_foot_light = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 38 * SCALE)

# 5. Top-Right: 3 Pills
pills = [
    ('GPS en Tiempo Real', (16, 185, 129), 'pin'),
    ('Llamadas sin Celular', (14, 165, 233), 'phone'),
    ('Loncheras Seguras', (245, 158, 11), 'check')
]

pill_w = 445 * SCALE
pill_h = 70 * SCALE
px = int(510 * SCALE)
py_start = int(135 * SCALE)
py_gap = int(96 * SCALE)

for i, (text, icon_color, icon_type) in enumerate(pills):
    py = py_start + i * py_gap
    pbox = [px, py, px + pill_w, py + pill_h]
    img = add_shadow(img, pbox, radius=pill_h//2, fill=(0, 15, 10, 55), blur=16*SCALE, offset=(0, 8*SCALE))
    
    pdraw = ImageDraw.Draw(img)
    pdraw.rounded_rectangle(pbox, radius=pill_h//2, fill=(255, 255, 255, 255))
    
    ic_cx = px + int(38 * SCALE)
    ic_cy = py + pill_h // 2
    ic_r = int(23 * SCALE)
    pdraw.ellipse([ic_cx - ic_r, ic_cy - ic_r, ic_cx + ic_r, ic_cy + ic_r], fill=icon_color)
    
    if icon_type == 'pin':
        pr = int(8.5 * SCALE)
        pdraw.ellipse([ic_cx - pr, ic_cy - int(9*SCALE) - pr, ic_cx + pr, ic_cy - int(9*SCALE) + pr], fill=(255, 255, 255))
        pdraw.polygon([(ic_cx - int(7.5*SCALE), ic_cy - int(6*SCALE)), (ic_cx + int(7.5*SCALE), ic_cy - int(6*SCALE)), (ic_cx, ic_cy + int(11*SCALE))], fill=(255, 255, 255))
        pdraw.ellipse([ic_cx - int(3.5*SCALE), ic_cy - int(9*SCALE) - int(3.5*SCALE), ic_cx + int(3.5*SCALE), ic_cy - int(9*SCALE) + int(3.5*SCALE)], fill=icon_color)
    elif icon_type == 'phone':
        h_sz = int(48 * SCALE)
        h_img = Image.new('RGBA', (h_sz, h_sz), (0, 0, 0, 0))
        h_d = ImageDraw.Draw(h_img)
        hcx, hcy = h_sz // 2, h_sz // 2
        S_h = SCALE
        h_d.rounded_rectangle([hcx - int(7*S_h), hcy - int(10*S_h), hcx + int(7*S_h), hcy - int(5*S_h)], radius=int(2.5*S_h), fill=(255, 255, 255))
        h_d.rounded_rectangle([hcx - int(7*S_h), hcy + int(5*S_h), hcx + int(7*S_h), hcy + int(10*S_h)], radius=int(2.5*S_h), fill=(255, 255, 255))
        h_d.rounded_rectangle([hcx - int(7*S_h), hcy - int(6*S_h), hcx - int(2*S_h), hcy + int(6*S_h)], radius=int(2.5*S_h), fill=(255, 255, 255))
        h_rot = h_img.rotate(135, resample=Image.Resampling.BICUBIC)
        img.paste(h_rot, (ic_cx - h_sz//2, ic_cy - h_sz//2), h_rot)
    elif icon_type == 'check':
        pts = [(ic_cx - int(8*SCALE), ic_cy), (ic_cx - int(2*SCALE), ic_cy + int(6.5*SCALE)), (ic_cx + int(9*SCALE), ic_cy - int(6.5*SCALE))]
        pdraw.line(pts, fill=(255, 255, 255), width=int(3.8*SCALE), joint='curve')
    
    pdraw.text((px + int(76 * SCALE), py + int(17 * SCALE)), text, font=font_pill, fill=(14, 42, 34))

draw = ImageDraw.Draw(img)

# 6. Brand Name: KIDWAY
y_title = int(525 * SCALE)
draw.text((70 * SCALE, y_title), 'KIDWAY', font=font_title, fill=(255, 255, 255))

# 7. Subtitles
y_sub1 = y_title + int(130 * SCALE)
y_sub2 = y_sub1 + int(64 * SCALE)
y_sub3 = y_sub2 + int(64 * SCALE)

draw.text((70 * SCALE, y_sub1), 'Ubicación GPS en Tiempo Real', font=font_sub, fill=(24, 226, 153))
draw.text((70 * SCALE, y_sub2), 'Llamadas Directas sin Celular', font=font_sub, fill=(24, 226, 153))
draw.text((70 * SCALE, y_sub3), 'Loncheras Escolares Seguras', font=font_sub, fill=(201, 214, 204))

# 8. Subtle divider
y_div = int(875 * SCALE)
draw.line([(70 * SCALE, y_div), ((1024 - 70) * SCALE, y_div)], fill=(35, 65, 52), width=int(2 * SCALE))

# 9. Footer: Colombia & kidway.co
y_foot = int(910 * SCALE)
draw.text((70 * SCALE, y_foot), 'Colombia', font=font_foot_light, fill=(159, 201, 174))

url_text = 'kidway.co'
url_bbox = draw.textbbox((0, 0), url_text, font=font_foot_bold)
url_w = url_bbox[2] - url_bbox[0]
rx = (1024 - 70) * SCALE - url_w

dot_cx = rx - int(20 * SCALE)
dot_cy = y_foot + int(24 * SCALE)
dot_r = int(6 * SCALE)
draw.ellipse([dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r], fill=(24, 226, 153))

draw.text((rx, y_foot), url_text, font=font_foot_bold, fill=(24, 226, 153))

# Final high-quality resize
final = img.resize((1024, 1024), Image.Resampling.LANCZOS)
final.convert('RGB').save(OUTPUT_PATH, 'PNG', quality=95)
print(f'✅ og-image.png regenerada con éxito en {OUTPUT_PATH}')
