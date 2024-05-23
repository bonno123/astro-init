import { column, defineDb, defineTable } from 'astro:db';

const Author = defineTable({
  columns: {
    // A unique identifier.
    id: column.number({ primaryKey: true }),
    name: column.text(),
  }
});

//  Define a table with columns
const Comment = defineTable({
  columns: {
    // A unique identifier.
    id: column.number({ primaryKey: true, autoIncrement: true}),

    // reference to the author table
    authorId: column.number({ references: () => Author.columns.id , optional: true}),

    // A string of text.
    content: column.text(),

    // A whole integer value.
    likes: column.number({ default: 0}),
    // A true or false value.
    flagged: column.boolean({ default: false}),
    // Date/time values queried as JavaScript Date objects.
    published: column.date({ default: new Date()}),
    // An untyped JSON object.
    metadata: column.json({ default: {}}),  
  }
})

// https://astro.build/db/config
export default defineDb({
  tables: { 
    Comment,
     Author 
  }
});
