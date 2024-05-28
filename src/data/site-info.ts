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
	description: `A personal app for Avik Banik, a software engineer and web developer based in Kolkata, India.`,
	image: {
		src: "/og/social.jpg",
		alt: "Build the web you want",
	},
}

export const heroWidget = {
	title: "Home",
	description: "",
	heroContent: {
		title: "Save or Pave...  Stars and Scars",
		description: "A completely arbitrary things with no purpose at all.",
	},
}

export const aboutMeWidget = {
	title: "About Me",
	description: "portfolio of software engineer, web developer.",
	aboutMe: {
		title: "Hello, I’m Avik",
		description: `
		I am a software engineer and web developer based in Kolkata, India.
		<br/>
		It's been 3 years since I started my tech journey.
		Worked with various technologies and frameworks like Vue.js, Quasar, Node.js, FastAPI, and databases like Oracle, postgreSQL with Prisma ORM.
		<br/><br/>
		I am currently working as a software engineer at a startup called RentApp.
		And also a part-time freelancer and have worked with clients from the UK(Slovakia), and India.
		I am always open to new opportunities.
		<br/><br/>
		Feel free to email me or connect with me on any of the following options! 
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
