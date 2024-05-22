import type { APIRoute } from "astro";
import { db, Comment, eq } from 'astro:db';

export const DELETE: APIRoute = async (ctx) => {
    console.log({ctx});
    
    await db.delete(Comment).where(eq(Comment.id, Number(ctx.params.id) ));
    return new Response(null, { status: 204 });
}