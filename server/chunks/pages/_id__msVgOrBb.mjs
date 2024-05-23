import { createRemoteDatabaseClient, asDrizzleTable } from '@astrojs/db/runtime';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';

const db = await createRemoteDatabaseClient(process.env.ASTRO_STUDIO_APP_TOKEN ?? "6adda8a2fa5df4d7bd53b9133a35fdfcd9d978e8:hbzon05gq1b5h2e406katdvnmbn9:hbzon05gq1b5h2e406katdvnmbn9", {"PUBLIC_SITE_NAME": "Avik Banik", "PUBLIC_CONTACT_EMAIL": "contact@avikbanik.com", "BASE_URL": "/", "MODE": "production", "DEV": false, "PROD": true, "SSR": true, "SITE": "https://avikbanik.com", "ASSETS_PREFIX": undefined}.ASTRO_STUDIO_REMOTE_DB_URL ?? "https://db.services.astro.build");
const Comment = asDrizzleTable("Comment", { "columns": { "id": { "type": "number", "schema": { "unique": false, "deprecated": false, "name": "id", "collection": "Comment", "primaryKey": true } }, "authorId": { "type": "number", "schema": { "unique": false, "deprecated": false, "name": "authorId", "collection": "Comment", "primaryKey": false, "optional": true, "references": { "type": "number", "schema": { "unique": false, "deprecated": false, "name": "id", "collection": "Author", "primaryKey": true } } } }, "content": { "type": "text", "schema": { "unique": false, "deprecated": false, "name": "content", "collection": "Comment", "primaryKey": false, "optional": false } }, "likes": { "type": "number", "schema": { "unique": false, "deprecated": false, "name": "likes", "collection": "Comment", "primaryKey": false, "optional": false, "default": 0 } }, "flagged": { "type": "boolean", "schema": { "optional": false, "unique": false, "deprecated": false, "name": "flagged", "collection": "Comment", "default": false } }, "published": { "type": "date", "schema": { "optional": false, "unique": false, "deprecated": false, "name": "published", "collection": "Comment", "default": "2024-05-23T07:20:37.489Z" } }, "metadata": { "type": "json", "schema": { "optional": false, "unique": false, "deprecated": false, "name": "metadata", "collection": "Comment", "default": {} } } }, "deprecated": false, "indexes": {} }, false);
asDrizzleTable("Author", { "columns": { "id": { "type": "number", "schema": { "unique": false, "deprecated": false, "name": "id", "collection": "Author", "primaryKey": true } }, "name": { "type": "text", "schema": { "unique": false, "deprecated": false, "name": "name", "collection": "Author", "primaryKey": false, "optional": false } } }, "deprecated": false, "indexes": {} }, false);

const prerender = false;
const DELETE = async (ctx) => {
  console.log({ ctx });
  const comment = await db.delete(Comment).where(eq(Comment.id, Number(ctx.params.id))).returning({ id: Comment.id });
  return new Response(JSON.stringify({ id: comment[0].id }), { status: 201 });
};

const _id_ = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	DELETE,
	prerender
}, Symbol.toStringTag, { value: 'Module' }));

export { Comment as C, _id_ as _, db as d };
