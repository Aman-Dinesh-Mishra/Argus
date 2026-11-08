import "dotenv/config";
import app from "./app.js";

const PORT = Number(process.env.PORT ?? 3000);

const server = app.listen(PORT, () => {
  console.log(`ARGUS API Gateway running on port ${PORT}`);
});

process.on("SIGINT", () => {
  server.close(() => {
    console.log("ARGUS API Gateway stopped");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  server.close(() => {
    console.log("ARGUS API Gateway stopped");
    process.exit(0);
  });
});
