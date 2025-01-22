export type SocialLink = {
	platform: string
	href: string
	me?: string
	text: string
	icon: string
	footerOnly?: boolean
}

export type SiteInfo = {
	title: string
	description: string
	image: {
		src: string
		alt: string
	}
}

export type HeroWidget = {
	title: string
	description: string
	socialLinks: SocialLink[]
}

export const siteInfo: SiteInfo = {
	title: `%s | ${import.meta.env.PUBLIC_SITE_NAME}`,
	description: `
		Landing page for Avik Banik, a Software Engineer and Web Developer from Kolkata, India.
	`,
	image: {
		src: "/og/social.jpg",
		alt: "Build the web you want",
	},
}

export const heroWidget = {
	title: "Landing",
	description: "Welcome to my 3D web design portfolio. Dive into a world where static sites come alive.",
	heroContent: {
		title: "Here’s a piece of responsive paper",
		description: `
			Welcome to the space of my imagination! 🚀
			<br>
			<br>
			While I'm currently enhancing this space with a plan to showcase my latest WebGL and GLSL creations,
			<br>
			feel free to explore the different sections of the site and discover the intersection of art and technology.
			<br>
			<br>
			Stay tuned for what's next! 🤔
		`,
	},
	socialLinks: [
		{
			platform: "github",
			href: "https://github.com/bonno123/astro-init",
			me: "https://github.com/bonno123",
			text: "Go to GitHub repo",
			icon: "social/github",
		},
		{
			platform: "twitter",
			href: "https://twitter.com/AvikBanik1",
			me: "https://twitter.com/AvikBanik1",
			text: "Follow on Twitter",
			icon: "social/twitter",
		},
		{
			platform: "kaggle",
			href: "https://www.kaggle.com/avikbanik",
			me: "https://www.kaggle.com/avikbanik",
			text: "Follow on kaggle",
			footerOnly: true,
			icon: "social/kaggle",
		},
		{
			platform: "codepen",
			href: "https://codepen.io/Bonno123",
			me: "https://codepen.io/Bonno123",
			text: "Follow on kaggle",
			footerOnly: true,
			icon: "social/codepen",
		},
	],
}

// currently this one is not using Path: src/data/about-me.ts
export const aboutMeWidget = {
	title: "About Me",
	description: "I'm a Software Engineer and Web Developer from Kolkata, India. With a passion for blending art and technology, I've worked on exciting projects.",
	aboutMe: {
		title: "Hello, I’m Avik",
		description: `
			I'm a Software Engineer and Web Developer from Kolkata, India. 
			<br/> <br/>
			With a passion for blending art and technology,
			I've worked on exiting projects. 
			My toolkit includes advanced proficiency in Vue.js, Quasar, Node.js, FastAPI, 
			and leveraging databases like Oracle and PostgreSQL with Prisma ORM 
			to bring dynamic projects to life.
			<br/>
			Currently at RentApp and freelancing, I'm always looking for new opportunities to collaborate on exciting projects.
			<br/><br/>
			Let's connect!
    	`,
		mail: import.meta.env.PUBLIC_CONTACT_EMAIL,
	},
	socialLinks: [
		{
			label: "X",
			link: "https://twitter.com/avikbanik1",
		},
		{
			label: "Github",
			link: "https://github.com/bonno123",
		},
		{
			label: "Linkedin",
			link: "https://www.linkedin.com/in/avik-banik-38b097140/",
		},
		{
			label: "Codepen",
			link: "https://codepen.io/Bonno123",
		},
		{
			label: "Kaggle",
			link: "https://www.kaggle.com/avikbanik",
		},
		{
			label: "Instagram",
			link: "https://www.instagram.com/_sporadikos_/",
		},
	],
}

export const contactWidget = {
	title: "Contact",
	description: "Let's connect! Feel free to reach out to me for any queries or collaborations.",
	contactForm: {
		title: "Get in touch",
		description: `
			Have a question or want to collaborate on a project? 
			Feel free to reach out to me using the form below.
		`,
	},
}
