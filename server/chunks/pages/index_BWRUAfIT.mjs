import { d as db, C as Comment } from './_id__msVgOrBb.mjs';

const prerender = false;
const POST = async ({ request }) => {
  const body = await request.json();
  console.log({ body });
  const comment = await db.insert(Comment).values([body]).returning({ id: Comment.id });
  return new Response(JSON.stringify({ id: comment[0].id }), { status: 201 });
};

export { POST, prerender };
