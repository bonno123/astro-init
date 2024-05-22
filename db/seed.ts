import { db, Comment, Author } from 'astro:db';

// https://astro.build/db/seed
export default async function seed() {

	// Insert an author
	await db.insert(Author).values([
		{
			id: 1,
			name: 'Alice',
		}
	])

	// Insert a comment
	await db.insert(Comment).values([
		{
			content: 'Hello, everyone!',
			authorId: 1,
			flagged: false,
			likes: 0,
			metadata: {
				createdAt: new Date(),
				updatedAt: new Date()
			},
			published: new Date(),
		},
	])
}
