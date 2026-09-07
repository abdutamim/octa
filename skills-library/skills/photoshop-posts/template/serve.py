# -*- coding: utf-8 -*-
"""
سيرفر المحرر — زي http.server العادي بس بيقبل الحفظ (PUT) لـ layout.json.
التشغيل:  py serve.py
وبعدين افتح:  http://127.0.0.1:8912/editor.html
"""
import http.server, socketserver, os, json

PORT = 8912
ALLOWED = {"layout.json", "prompts.json"}   # الملفات المسموح الكتابة فيها فقط


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # منع الكاش — القوالب بتتعدّل كل شوية
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def do_PUT(self):
        name = os.path.basename(self.path.split("?")[0])
        if name not in ALLOWED:
            self.send_error(403, "not allowed: " + name)
            return
        try:
            body = self.rfile.read(int(self.headers["Content-Length"]))
            json.loads(body)                       # لازم JSON سليم
            with open(name, "wb") as f:
                f.write(body)
            self.send_response(200)
            self.send_header("Content-Length", "2")
            self.end_headers()
            self.wfile.write(b"ok")
            print("saved:", name)
        except Exception as e:
            self.send_error(400, str(e))

    def log_message(self, fmt, *a):
        # send_error بيبعت أرقام مش نصوص — لازم نحوّل قبل الفحص
        first = str(a[0]) if a else ""
        if "PUT" in first or "code" in fmt:
            super().log_message(fmt, *a)


os.chdir(os.path.dirname(os.path.abspath(__file__)))
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    print("http://127.0.0.1:%d/editor.html" % PORT)
    httpd.serve_forever()
