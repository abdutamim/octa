#!/usr/bin/env bash
# رندر ستوريات آركيدوت — 1080x1920
# 1) شغّل السيرفر:  py -m http.server 8912 --bind 127.0.0.1
# 2) شغّل ده:       bash render.sh
set -e
CH='/c/Program Files/Google/Chrome/Application/chrome.exe'
OUT='C:/Users/Admin/Desktop/Tamim Portfolio/archidot-social/stories/out'
PORT="${PORT:-8912}"

for id in 01-room 02-home 03-facade; do
  rm -rf "$TEMP/crs-$id"   # كاش Chrome كان بيرجّع نسخة قديمة
  echo "رندر $id ..."
  "$CH" --headless=new --disable-gpu --hide-scrollbars \
        --force-device-scale-factor=1 --user-data-dir="$TEMP/crs-$id" \
        --window-size=1080,1920 --virtual-time-budget=10000 \
        --screenshot="$OUT/$id.png" \
        "http://127.0.0.1:$PORT/story.html?id=$id&cb=$(date +%s%N)" 2>&1 | tail -1
done
echo "تم — الناتج في out/"
