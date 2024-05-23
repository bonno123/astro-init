export const prerender = false  // disable static rendering since app is configured as hybrid

import type { APIRoute } from "astro";
import { db, Comment, eq } from 'astro:db';

export const DELETE: APIRoute = async (ctx) => {
    console.log({ctx});
    
    const comment = await db.delete(Comment).where(eq(Comment.id, Number(ctx.params.id) )).returning({ id: Comment.id });
    // return new Response(JSON.stringify({id: comment[0].id}, { status: 204 }));

    return new Response(JSON.stringify({id: comment[0].id}), { status: 201 });

}