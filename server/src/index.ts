import { createApp } from "./app.ts";
import { config } from "./config.ts";

const app = createApp(config);

app.server.listen(config.port, config.host, () => {
  console.log(`Guess the Block server on http://${config.host}:${config.port}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    app.close();
    process.exit(0);
  });
}
