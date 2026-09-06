import re

with open(r'c:\Users\Admin\Documents\Máy tính\code\nexus-system\src\pages\LoginPage.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip_indices = {
    86, # 0-indexed for line 87
    117, # line 118
    122, # line 123
    129, # line 130
    132, # line 133
    142, # line 143
    147, # line 148
    155, # line 156
    164, # line 165
    170, # line 171
    178, # line 179
    184, # line 185
    206, # line 207
    210, # line 211
    220, # line 221
    223, # line 224
    226, # line 227
    227, # line 228
    236, # line 237
    239, # line 240
    242, # line 243
    243, # line 244
    252, # line 253
    255, # line 256
    258, # line 259
    259, # line 260
    268, # line 269
    271, # line 272
    274, # line 275
    275, # line 276
    286, # line 287
    289, # line 290
}

for i, line in enumerate(lines):
    if i in skip_indices:
        continue
    new_lines.append(line)

with open(r'c:\Users\Admin\Documents\Máy tính\code\nexus-system\src\pages\LoginPage.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

