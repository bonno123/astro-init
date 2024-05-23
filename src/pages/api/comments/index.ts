export const prerender = false  // disable static rendering since app is configured as hybrid

import type { APIRoute } from "astro";
import { db, Comment, eq } from 'astro:db';

export const POST: APIRoute = async ({ request }) => {
    const body = await request.json();

    console.log({body});
    
    const comment = await db.insert(Comment).values([body]).returning({ id: Comment.id });


    return new Response(JSON.stringify({id: comment[0].id}), { status: 201 });
}
