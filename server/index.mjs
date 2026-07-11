import { createApp } from "./app.mjs";

const port = Number(process.env.PORT || 8790);
createApp().listen(port, "127.0.0.1", () => {
  console.log(`CRM AI Gateway demo: http://127.0.0.1:${port}`);
});
