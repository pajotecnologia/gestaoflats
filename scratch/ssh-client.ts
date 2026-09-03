import { Client } from "ssh2";

export function execSSH(command: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on("ready", () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }
        let stdout = "";
        let stderr = "";
        stream.on("close", (code: number) => {
          conn.end();
          resolve({ stdout, stderr, code });
        });
        stream.on("data", (data: Buffer) => {
          stdout += data.toString();
        });
        stream.stderr.on("data", (data: Buffer) => {
          stderr += data.toString();
        });
      });
    });
    conn.on("error", (err) => reject(err));
    conn.connect({
      host: "169.58.246.70",
      port: 22,
      username: "root",
      password: "Click3112",
      readyTimeout: 20000,
    });
  });
}

async function main() {
  const cmd = process.argv.slice(2).join(" ") || "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}'";
  console.log(`[SSH] Executing: ${cmd}`);
  try {
    const res = await execSSH(cmd);
    console.log(`[SSH] Exit Code: ${res.code}`);
    if (res.stdout) console.log(`[STDOUT]\n${res.stdout}`);
    if (res.stderr) console.log(`[STDERR]\n${res.stderr}`);
  } catch (err: any) {
    console.error("[SSH] Error:", err.message);
  }
}

if (require.main === module) {
  main();
}
