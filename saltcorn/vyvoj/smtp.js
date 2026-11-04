// Testovací SMTP server (port 2525): každou zprávu uloží jako JSON (včetně příloh) do složky mail-out/
const { SMTPServer } = require("smtp-server");
const { simpleParser } = require("mailparser");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "mail-out");
fs.mkdirSync(OUT, { recursive: true });
let n = 0;
new SMTPServer({
  authOptional: true, disabledCommands: ["STARTTLS"],
  onData(stream, session, cb) {
    simpleParser(stream).then((m) => {
      const f = path.join(OUT, `${Date.now()}-${++n}.json`);
      fs.writeFileSync(f, JSON.stringify({ to: m.to?.text, from: m.from?.text, subject: m.subject, text: m.text, html: m.html,
        attachments: (m.attachments || []).map((a) => ({ filename: a.filename, contentType: a.contentType, size: a.size, head: a.content.slice(0, 8).toString() })) }, null, 2));
      console.log("ulozeno", f); cb();
    }).catch((e) => { console.error(e); cb(e); });
  },
}).listen(2525, () => console.log("SMTP na 2525"));
