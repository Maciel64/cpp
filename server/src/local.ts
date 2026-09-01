import { app } from ".";

app.listen(process.env.PORT || 3000);

console.log(`Elysia is running on ${app.server?.hostname}:${app.server?.port}`);
